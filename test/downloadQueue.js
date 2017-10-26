let expect = require('chai').expect;
let {private: {_addToQueue, _downloadQueue, _isEmpty, _getNext, _queueSize}} = require('../src/downloadQueue');

let noop = ()=>{};

describe('DownloadQueue', function(){
    describe('_addToQueue', function(){
        const addToQueueTestUrl = 'https://www.google.com/';
    
        it('Should increase the size of the download queue by 1', function() {
            let initialLength = _downloadQueue.length;
            _addToQueue(addToQueueTestUrl, noop);
            let afterLength = _downloadQueue.length;
            expect(afterLength).to.equal(initialLength+1);
        });
    
        it('Should place the item on the queue', function() {
            let addedItem = _downloadQueue.find(function(element){
                return element.url===addToQueueTestUrl;
            });
            expect(addedItem.url).to.deep.equal(addToQueueTestUrl);
        });
    });//End describe('_addToQueue')
    
    describe('_getNext', function(){
        {
            const url1 = 'https://url.1.com';
            const url2 = 'https://url.2.com';
    
            beforeEach(function(){
                _addToQueue(url1, noop);
                _addToQueue(url2, noop);
            });
    
            it('Returns the first item on the queue', function() {
                let firstItem = _downloadQueue[0];
                let next = _getNext();
                expect(next).to.deep.equal(firstItem);
            });
        
            it('Removes the item from the queue', function() {
                let removedItem = _getNext
                _downloadQueue.forEach(function(element) {
                    expect(element).to.not.deep.equal(removedItem);
                });
            });

            it('Does not break when an called with an empty queue', function() {
                let first = _getNext();
                let second = _getNext();
                expect(_queueSize()).to.equal(0);
                let third = _getNext();
                expect(third).to.deep.equal(undefined);
            });

            afterEach(function(){
                while(_queueSize()>0){
                    _getNext();
                }
            });
        }
    });//End describe('_getNext')

    describe('_isEmpty', function(){
        it('returns true when the list is empty', function(){
            expect(_downloadQueue.length).to.equal(0);
            expect(_isEmpty()).to.equal(true);
        });

        it('returns false when the list has contents', function(){
            _addToQueue('https://www.google.com/', noop);
            expect(_downloadQueue.length).to.equal(1);
            expect(_isEmpty()).to.equal(false);
        });

        it('returns true when emptied again', function(){
            console.log(_downloadQueue);
            _getNext();
            console.log(_downloadQueue)
        });
    });
});//End describe('DownloadQueue')
