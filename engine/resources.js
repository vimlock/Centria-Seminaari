(function(context) {

    /**
     * Returns path part of an url, i.e.
     * http://foo.bar/biz/asset.png -> /biz/asset.png
     */
    function getUrlPath(url) {
        // TODO: just use the url now, works good enough
        return url;
    }

    context.ResourceManager = class {

        constructor() {
            /// Stores the loaded resources, should not be accessed directly.
            this.cache = new Map();

            /// Stores the resources currently being loaded.
            this.loading = new Map();

            /// Called when the loading queue reaches zero.
            this.onAllLoadedEvent = new Event();
        }

        /**
         * Returns a resource from the resource managers cache.
         *
         * If a resource has been loaded as a Mesh, but the caller
         * requests a Texture with the sameUrl, an exception will be thrown.
         */
        getCached(type, sourceUrl) {
            if (!type) {
                throw new Error("No resource type given");
            }

            if (!sourceUrl) {
                throw new Error("No resource name given");
            }

            let tmp = this.cache.get(sourceUrl);
            if (!(tmp instanceof type)) {
                throw new Error("Resource " + sourceUrl + " requested as " + type.name
                    + " but it has been loaded as " + tmp.constructor.name
                );
            }

            return tmp;
        }

        /**
         * Remove a resource from the cache.
         *
         * Note that this function has no effect if the resource is currently being loaded.
         *
         * @param name {string} Id of the resource.
         */
        removeCached(name) {
            this.cache.delete(name);
        }

        /**
         * Mark the resource for loading.
         *
         * This function does not return anything so you should subscribe
         * to onAllLoadedEvent by calling ResourceManager.onAllLoaded().
         *
         * After the resource has been loaded you should use getCached()
         * function to retrive the resource.
         *
         * @param type Class of the resource to be loaded.
         * @param sourceUrl {String} Where to download the resource from.
         */
        queueForLoading(type, sourceUrl) {
            let name = getUrlPath(sourceUrl);

            let resourceManager = this;

            function loadCompleteHandler(data) {
                // [this] might be bound to some crazy values so don't use it here.
                resourceManager._onLoadComplete(sourceUrl, name, type, data);
            }

            // Resource loaded and nothing to do?
            if (this.cache.has(sourceUrl)) {
                return;
            }

            // Already loading the resource?
            if (this.loading.has(sourceUrl)) {
                return;
            }

            // Mark the resource for loading so we don't accidentally load it twice
            this.loading.set(sourceUrl, null);

            // Allow the type to handle the loading, if it wants to.
            if (type.loadOverride) {
                type.loadOverride(sourceUrl, loadCompleteHandler);
            }
            else {
                this._loadAsync(sourceUrl, loadCompleteHandler);
            }
        }

        /**
         * Call the given callback after all the resources have been loaded.
         *
         * @param callback {function} A callback function which should have no parameters.
         */
        onAllLoaded(callback) {
            if (this.loading.size === 0) {
                callback();
                return;
            }
            else {
                this.onAllLoadedEvent.addListener(callback);
            }
        }

        addBuiltinResource(name, resource) {
            this.cache.set(name, resource);
        }

        /**
         * Attempts to load the resource using an asynchronous XMLHttpRequest.
         *
         * You should not call this method directly.
         */
        _loadAsync(sourceUrl, callback) {
            // Get file with XMLHttpRequest
            var x = new XMLHttpRequest();
            
            // Open a new request and set the preferred file transfer method
            // GET or POST. POST is more secure than GET
            x.open("GET", sourceUrl, true);
            x.overrideMimeType("text/plain");
            
            // Handler needs some data. Set said data to the request
            x.callback = callback;
            x.resourceManager = this;
            x.sourceUrl = sourceUrl;

            x.onerror = function() {
                this.callback(null);
            }

            x.onload = function() {
                this.callback(this.response);
            };
            
            // Send request to server. Server send data with 
            x.send();
        }

        /**
         * Called by resource load functions when the loading has been
         * completed.
         *
         * This will attempt to parse the resource from the given data.
         *
         * You should not call this method directly.
         */
        _onLoadComplete(sourceUrl, name, type, data) {
            let resource = null;

            this.loading.delete(sourceUrl);

            // If the data is not falsy, assume that the loading succeeded
            if (data) {
                try {
                    resource = type.parse(data, sourceUrl);
                    resource.name = name;
                    resource.sourceUrl = sourceUrl;

                    console.log("Loaded resource " + name);
                }
                catch(e) {
                    console.log("Exception occured during parsing of a resource");
                    console.log(e);
                }
            }
            else {
                console.log("Failed to load resource " + name + " from " + sourceUrl);
            }

            this.cache.set(sourceUrl, resource);

            if (this.loading.size === 0) {
                this.onAllLoadedEvent.invoke();
            }
        }
    };
    
    // Example class
    context.Texture = class Texture {
        constructor(imgSrc, glTexture) {
            this.imgSrc = imgSrc;
            this.glTexture  = glTexture;
        }

        static loadOverride(sourceUrl) {
            // TODO
        }
        
        static parse(data) {
            /// Create an URL for the image stored in RAM
            /// The URL is given for an image object as a source
            let imgSrc = window.URL.createObjectURL(data);
            let glTexture = Texture._uploadToGPU(imgSrc);

            return new Texture(imgSrc, glTexture);
        }

        static _uploadToGpu(img) {
            // TODO: And here's where the magic happens.
            return null;
        }

    };

    context.CubeMap = class CubeMap {
        constructor() {
            this.glTexture = null;
        }
    };
    
})(this);
