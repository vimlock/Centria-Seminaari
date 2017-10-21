/* global engine, Resource */
"use strict";


(function(context) {
    
    
    context.Texture = class Texture extends Resource {
      
        constructor(imgSrc, glTexture) {
            super();
            this.imgSrc = imgSrc;
            this.glTexture  = glTexture;
        }


        static loadOverride(sourceUrl, callback) {
            // TODO
            let image = new Image();
            image.onload = function() {
                callback(image);
            };

            image.src = sourceUrl;
        }
        
        
        static parse(data, sourceUrl) {
            /// Create an URL for the image stored in RAM
            /// The URL is given for an image object as a source
            let imgSrc = sourceUrl;
            let glTexture = Texture._uploadToGPU(data);

            return new Texture(imgSrc, glTexture);
        }
        
        
        static makeTexture(format, width, height, color) {
            /// Creates a texture manually. In most cases used if no texture is available
            /// Format: RGBA / RGBA
            /// Width and height: texture dimensions
            /// Color: Color.white.toArray()
            
            let gl = engine.gl;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, new Uint8Array([...color]));
            // Unbind texture so no accidents happen
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        }
        
        
        static _uploadToGPU(img) {
            // TODO: And here's where the magic happens.
            let gl = engine.gl;
            
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            // If power of 2 width and height, generate mipmap
            if(img.width && img.height && !(img.width & (img.width - 1)) && !(img.height & (img.height - 1)))
                gl.generateMipmap(gl.TEXTURE_2D);
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            // Unbind texture so no accidents happen
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            return texture;
        }
        
        
    };

    
})(this);
