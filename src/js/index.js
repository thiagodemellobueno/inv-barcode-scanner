import '@georapbox/web-share-element/dist/web-share-defined.js';
import '@georapbox/resize-observer-element/dist/resize-observer-defined.js';
import '@georapbox/alert-element/dist/alert-element-defined.js';
import { ACCEPTED_MIME_TYPES } from './constants.js';
import { getSettings, setSettings } from './services/storage.js';
// import { debounce } from './utils/debounce.js';
import { log } from './utils/log.js';
// import { isDialogElementSupported } from './utils/isDialogElementSupported.js';
import { createResult } from './helpers/result.js';
import { triggerScanEffects } from './helpers/triggerScanEffects.js';
import { resizeScanFrame } from './helpers/resizeScanFrame.js';
import { BarcodeReader } from './helpers/BarcodeReader.js';
import { toggleTorchButtonStatus } from './helpers/toggleTorchButtonStatus.js';
import { toastify } from './helpers/toastify.js';
import { VideoCapture } from './components/video-capture.js';
import './components/clipboard-copy.js';
import './components/bs-result.js';
import { parseBook, fetchBook, updateBook, addBook } from './utils/data.js';

/*
@todo - load remote csv, or datastore to csv on load
@todo - show download button
@todo - consider 'start scanning' button
*/

(async function () {
  const videoCaptureEl = document.querySelector('video-capture');
  const cameraPanel = document.getElementById('cameraPanel');
  const cameraResultsEl = cameraPanel.querySelector('.results');
  const scanInstructionsEl = document.getElementById('scanInstructions');
  const scanBtn = document.getElementById('scanBtn');
  const resizeObserverEl = document.querySelector('resize-observer');
  const scanFrameEl = document.getElementById('scanFrame');
  const torchButton = document.getElementById('torchButton');
  const globalActionsEl = document.getElementById('globalActions');
  const cameraSelect = document.getElementById('cameraSelect');
  const SCAN_RATE_LIMIT = 1000;
  let scanTimeoutId = null;
  let shouldScan = true;

  let bookInventory = {}; // await csvToObject(csvData);

  const { barcodeReaderError } = await BarcodeReader.setup();

  if (barcodeReaderError) {
    const alertEl = document.getElementById('barcodeReaderError');

    shouldScan = false;
    globalActionsEl?.setAttribute('hidden', '');
    alertEl?.setAttribute('open', '');

    return; // Stop the script execution as BarcodeDetector API is not supported.
  }

  const supportedBarcodeFormats = await BarcodeReader.getSupportedFormats();
  const intitialFormats = supportedBarcodeFormats;
  let barcodeReader = await BarcodeReader.create(intitialFormats);

  videoCaptureEl.addEventListener('video-capture:video-play', handleVideoCapturePlay, {
    once: true
  });

  videoCaptureEl.addEventListener('video-capture:error', handleVideoCaptureError, {
    once: true
  });

  VideoCapture.defineCustomElement();

  const videoCaptureShadowRoot = videoCaptureEl?.shadowRoot;
  const videoCaptureVideoEl = videoCaptureShadowRoot?.querySelector('video');
  const videoCaptureActionsEl = videoCaptureShadowRoot?.querySelector('[part="actions-container"]');

  /**
   * Scans for barcodes.
   * If a barcode is detected, it stops scanning and displays the result.
   *
   * @returns {Promise<void>} - A Promise that resolves when the barcode is detected.
   */
  async function scan() {
    if (!shouldScan) {
      return;
    }

    log.info('Scanning...');

    scanInstructionsEl?.removeAttribute('hidden');

    try {
      // console.log('scan');
      const [, settings] = await getSettings();
      const barcode = await barcodeReader.detect(videoCaptureVideoEl);
      const barcodeValue = barcode?.rawValue ?? '';

      if (!barcodeValue) {
        throw new Error('No barcode detected');
      }

      log.info('\tFound bardode', barcodeValue);
      createResult(cameraResultsEl, barcodeValue);
      let book = await getBook(barcodeValue, bookInventory);
      bookInventory = updateBook(book, bookInventory);

      triggerScanEffects();

      if (!settings?.continueScanning) {
        if (scanTimeoutId) {
          clearTimeout(scanTimeoutId);
          scanTimeoutId = null;
        }
        scanBtn?.removeAttribute('hidden');
        scanFrameEl?.setAttribute('hidden', '');
        videoCaptureActionsEl?.setAttribute('hidden', '');
        return;
      }
    } catch {
      // If no barcode is detected, the error is caught here.
      // We can ignore the error and continue scanning.
    }

    if (shouldScan) {
      scanTimeoutId = setTimeout(() => scan(), SCAN_RATE_LIMIT);
    }
  }

  async function getBook(barcodeValue) {
    let book = await fetchBook(barcodeValue);
    // if we get a book out of it, we then perpare the object and...
    try {
      return parseBook(book);
    } catch (error) {
      log.info('Error:', error);
    }
  }

  /**
   * Handles the click event on the download CSV.
   * It is responsible for clearing previous results and starting the scan process again.
   */
  async function handleDownloadButtonClick(e) {
    // either open it up as text.
    // store it somewhere.
    let bookArray = [];
    let output = '';
    log.info('handleDownloadButtonClick', bookInventory);

    const headers = [
      'isbn',
      'title',
      'authors',
      'publishers',
      'first_publish_year',
      'count',
      'dateAdded',
      'dateModified',
      'consignee'
    ];

    output += headers.join(',').toString() + '\n';

    for (let book in bookInventory) {
      console.log('prepping download for »', book);
      let bk = bookInventory[book];
      for (let item in bk) {
        console.log('»»', book, item, bk[item]);
        let entry = bk[item];
        if (typeof bk[item] === Array) {
          entry = bk[item].join(', ');
        }
        output += `"${entry}",`;
      }
      output += '\n';
      // console.log('\n::::\n', output);
    }
  }
  async function handleTestAPI(e) {
    let bookObj = {
      isbn: 9781839762123,
      first_publish_date: 1902,
      title: 'Mutual Aid: A Factor in Evolution',
      authors: 'Peter Kropotkin',
      dateAdded: new Date(Date.now()).toString(),
      dateModified: Date(Date.now()).toString(),
      count: 1
    };

    addBook(bookObj);
  }

  const downloadButton = document.querySelector('.downloadButton');
  downloadButton?.addEventListener('click', handleTestAPI);

  /**
   * Handles the click event on the scan button.
   * It is responsible for clearing previous results and starting the scan process again.
   */
  function handleScanButtonClick() {
    scanBtn?.setAttribute('hidden', '');
    scanFrameEl?.removeAttribute('hidden');
    videoCaptureActionsEl?.removeAttribute('hidden');
    scan();
  }

  /**
   * Handles the resize event on the video-capture element.
   * It is responsible for resizing the scan frame based on the video element.
   */
  function handleVideoCaptureResize() {
    resizeScanFrame(videoCaptureEl.shadowRoot.querySelector('video'), scanFrameEl);
  }

  /**
   * Handles the video play event on the video-capture element.
   * It is responsible for displaying the scan frame and starting the scan process.
   * It also handles the zoom controls if the browser supports it.
   *
   * @param {CustomEvent} evt - The event object.
   */
  async function handleVideoCapturePlay(evt) {
    scanFrameEl?.removeAttribute('hidden');
    resizeScanFrame(evt.detail.video, scanFrameEl);
    scan();

    const trackSettings = evt.target.getTrackSettings();
    const trackCapabilities = evt.target.getTrackCapabilities();
    const zoomLevelEl = document.getElementById('zoomLevel');

    // Torch CTA
    if (trackCapabilities?.torch) {
      torchButton?.addEventListener('click', handleTorchButtonClick);
      torchButton?.removeAttribute('hidden');

      if (videoCaptureEl.hasAttribute('torch')) {
        toggleTorchButtonStatus({ el: torchButton, isTorchOn: true });
      }
    }

    // Zoom controls
    if (trackSettings?.zoom && trackCapabilities?.zoom) {
      const zoomControls = document.getElementById('zoomControls');
      const minZoom = trackCapabilities?.zoom?.min || 0;
      const maxZoom = trackCapabilities?.zoom?.max || 10;
      let currentZoom = trackSettings?.zoom || 1;

      const handleZoomControlsClick = evt => {
        const zoomInBtn = evt.target.closest('[data-action="zoom-in"]');
        const zoomOutBtn = evt.target.closest('[data-action="zoom-out"]');

        if (zoomInBtn && currentZoom < maxZoom) {
          currentZoom += 0.5;
        }

        if (zoomOutBtn && currentZoom > minZoom) {
          currentZoom -= 0.5;
        }

        zoomLevelEl.textContent = currentZoom.toFixed(1);
        videoCaptureEl.zoom = currentZoom;
      };

      zoomControls?.addEventListener('click', handleZoomControlsClick);
      zoomControls?.removeAttribute('hidden');
      zoomLevelEl.textContent = currentZoom.toFixed(1);
    }

    // Camera select
    const videoInputDevices = await VideoCapture.getVideoInputDevices();

    videoInputDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    if (videoInputDevices.length > 1) {
      cameraSelect?.addEventListener('change', handleCameraSelectChange);
      cameraSelect?.removeAttribute('hidden');
    }
  }

  /**
   * Handles the error event on the video-capture element.
   * It is responsible for displaying an error message if the camera cannot be accessed or permission is denied.
   *
   * @param {CustomEvent} evt - The event object.
   */
  function handleVideoCaptureError(evt) {
    const error = evt.detail.error;

    if (error.name === 'NotFoundError') {
      // If the browser cannot find all media tracks with the specified types that meet the constraints given.
      return;
    }

    const errorMessage =
      error.name === 'NotAllowedError'
        ? `<strong>Error accessing camera</strong><br>Permission to use webcam was denied or video Autoplay is disabled. Reload the page to give appropriate permissions to webcam.`
        : error.message;

    cameraPanel.innerHTML = /* html */ `
      <alert-element variant="danger" open>
        <span slot="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.54.146A.5.5 0 0 1 4.893 0h6.214a.5.5 0 0 1 .353.146l4.394 4.394a.5.5 0 0 1 .146.353v6.214a.5.5 0 0 1-.146.353l-4.394 4.394a.5.5 0 0 1-.353.146H4.893a.5.5 0 0 1-.353-.146L.146 11.46A.5.5 0 0 1 0 11.107V4.893a.5.5 0 0 1 .146-.353zM5.1 1 1 5.1v5.8L5.1 15h5.8l4.1-4.1V5.1L10.9 1z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </span>
        ${errorMessage}
      </alert-element>
    `;
  }

  /**
   * Handles the click event on the torch button.
   * It is responsible for toggling the torch on and off.
   *
   * @param {MouseEvent} evt - The event object.
   */
  function handleTorchButtonClick(evt) {
    videoCaptureEl.torch = !videoCaptureEl.torch;

    toggleTorchButtonStatus({
      el: evt.currentTarget,
      isTorchOn: videoCaptureEl.hasAttribute('torch')
    });
  }

  /**
   * Handles the change event on the camera select element.
   * It is responsible for restarting the video stream with the selected video input device id.
   *
   * @param {Event} evt - The event object.
   */
  function handleCameraSelectChange(evt) {
    if (typeof videoCaptureEl.restartVideoStream !== 'function') {
      return;
    }

    const videoDeviceId = evt.target.value || undefined;
    videoCaptureEl.restartVideoStream(videoDeviceId);
  }

  /**
   * Handles the visibility change event on the document.
   * It is responsible for stopping the scan process when the document is not visible.
   */
  function handleDocumentVisibilityChange() {
    // if (tabId !== 'cameraTab') {
    //   return;
    // }

    if (document.visibilityState === 'hidden') {
      shouldScan = false;

      if (videoCaptureEl != null && typeof videoCaptureEl.stopVideoStream === 'function') {
        videoCaptureEl.stopVideoStream();
      }
    } else {
      shouldScan = true;

      // Get the latest instance of video-capture element to ensure we don't use the cached one.
      const videoCaptureEl = document.querySelector('video-capture');

      if (!videoCaptureEl) {
        return;
      }

      if (!videoCaptureEl.loading && scanBtn.hasAttribute('hidden')) {
        scan();
      }

      if (typeof videoCaptureEl.startVideoStream === 'function') {
        const videoDeviceId = cameraSelect?.value || undefined;
        videoCaptureEl.startVideoStream(videoDeviceId);
      }
    }
  }

  /**
   * Handles the escape key press event on the document.
   * It is responsible for triggering the scan button click event if there is already a barcode detected.
   */
  function handleDocumentEscapeKey() {
    const cameraTabSelected = true; //tabGroupEl.querySelector('#cameraTab').hasAttribute('selected');
    const scanBtnVisible = !scanBtn.hidden;

    if (!scanBtnVisible || !cameraTabSelected || anyDialogOpen) {
      return;
    }

    scanBtn.click();
  }

  /**
   * Handles the key down event on the document.
   */
  function handleDocumentKeyDown(evt) {
    if (evt.key === 'Escape') {
      handleDocumentEscapeKey();
    }
  }

  scanBtn.addEventListener('click', handleScanButtonClick);
  resizeObserverEl.addEventListener('resize-observer:resize', handleVideoCaptureResize);
  document.addEventListener('visibilitychange', handleDocumentVisibilityChange);
  document.addEventListener('keydown', handleDocumentKeyDown);
})();
