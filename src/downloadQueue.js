let _downloadQueue = [];
let _downloadInProgress = false;
let youtubeDL = require('youtube-dl');

/**
 * Adda  url to the download queue
 * @param {string} url
 */
function _addToQueue(url) {
  _downloadQueue.push(url);
}

/**
 * Get next url to download
 * @return {string} url
 */
function _getNext() {
  if (_downloadQueue.length > 0) {
    return _downloadQueue.shift();
  }
}

/**
 * @return {number} number of items remaining in the download queue.
 */
function _queueSize() {
  return _downloadQueue.length;
}

/**
 * @return {boolean} if the queue has no more items.
 */
function _isEmpty() {
  return _downloadQueue.length > 0;
}
/**
 * Take a url and download it as a mp3.
 * TODO: get the ID first and check for an existing mp3
 * @param {string} url
 */
export function download(url) {
  //fetch id and check existing files if not there download it
  _addToQueue(url);
  //start downloading if one isn't in progress.
  _startDownload();
}

function _startDownload() {
  if (!_downloadInProgress) {
    _downloadInProgress = true;
    youtubeDL.exec(
      url,
      ['-x', '--audio-format', 'mp3', '--audio-quality', '128K'],
      {},
      _downloadComplete
    );
  }
}

function _downloadComplete(err, output) {
  if (err) {
    throw err;
  } else {
    // Play file
    console.log(output.join('\n'));
  }
}
