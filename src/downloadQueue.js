// TODO switch to promises??
let youtubeDL = require('youtube-dl');
let _downloadQueue = [];
let _downloadInProgress = false;

/**
 * Adda  url to the download queue
 * @param {string} url
 * @param {function} callback to execute when file is available
 */
function _addToQueue(url, callback) {
  _downloadQueue.push({url: url, callback: callback});
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
  return _downloadQueue.length === 0;
}
/**
 * Take a url and download it as a mp3.
 * TODO: get the ID first and check for an existing mp3
 * @param {string} url
 * @param {function} callback to execute when file is available
 */
exports.download = function download(url, callback) {
  console.log(`adding to queue ${url}`);
  // fetch id and check existing files if not there download it
  // may need to also check the queue for duplicates... somehow
  _addToQueue(url, callback);
  // start downloading if one isn't in progress.
  _startDownload();
};

/**
 * Gets the next download from the queue and fetch it
 */
function _startDownload() {
  console.log('in start DL');
  if (!_downloadInProgress && !_isEmpty()) {
    console.log(`console.log startin DL`);
    _downloadInProgress = true;
    let download = _getNext();
    console.log('download', download);

    youtubeDL.exec(
      download.url,
      ['-x', '--print-json', '--audio-format', 'mp3', '--audio-quality', '128K'],
      {maxBuffer: Infinity},
      function(error, output) {
        console.log('=================');
        console.log(output);
        _downloadComplete(error, output, download.callback);
      }
    );
  }
}


/**
 * Used to handle the result of exxecution of a youtube-dl
 * @param {error} err any errors youtube-dl encountered
 * @param {Array} output of youtube-dl
 * @param {function} callback to handle getting the file - paramters not yet deinfed
 */
function _downloadComplete(err, output, callback) {
  console.log('in dl complete');
  let fileName;
  if (err) {
    console.log(`Download failed: ${err}`); // TODO:
  } else {
    // let outputFilesRegex = /\[ffmpeg\] Destination: (.*?\..*?)'/;  //Smash the output together and then globally match this regex?
    let downloadInfo = JSON.parse(output);
    // Get the download file name and replace the extension with mp3 since thats how its output
    fileName = downloadInfo._filename;
    fileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.mp3';
  }
  _downloadInProgress = false;
  _startDownload();
  try{
    callback(!err, fileName);
  } catch(error) {
    console.log(error)
    console.error('Callback in _downloadComplete of downloadQueue failed');
  }
}
