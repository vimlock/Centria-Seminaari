"use strict";

(function(context) {


    context.mat3 = {
        
        
        multiplyVector(m, v) {
            return [
                m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
                m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
                m[6] * v[0] + m[7] * v[1] + m[8] * v[2] ];
        }
        
        
    };
    
    
})(this);
