// Check for Proxy support
if(!global.Proxy) {
    console.error('[jxa] Proxy support is required!');
    console.error('Please either: ');
    console.error(' - Relaunch node with the --harmony-proxies flag');
    console.error(' - Upgrade to node >= 6.2.0');
    process.exit(1);
}

// The AppleScript API is accessed through the `osascript` binary
var exec = require('child_process').execSync;

// Access the contents of a reference
function dereference(path, args, recv) {
    try { // Run the osascript binary in inline script mode, stringifying the reference
        var cmdArgs = recv == undefined ? '' : JSON.stringify(recv).replace(/^\[/, '').replace(/\]$/, '');
        var cmd = `osascript -l JavaScript -e 'JSON.stringify(${path}(${cmdArgs}));'`
        var res = exec(cmd, { stdio: '' }).toString().trim();
        return JSON.parse(res);
    } catch(e) {
    }
};

// Used when the node REPL calls .inspect() to print a reference
function createInspector(path)  {
    return () => `[object JXAReference => ${dereference(path+'.toString')}]`;
}

// Create a pointer to an object in the AppleScript API
function createReference(path) {

    // Object being proxied is the dereference function
    return new Proxy(function(recv, _, args, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
        arg_vals = []
        for(i in arguments) { arg_vals.push( arguments[i] ) }
        return dereference(path, args, arg_vals);
    }, {
        get: (_, prop) => {
            if(prop == 'inspect') // Handle node REPL's .inspect() calls
                return createInspector(path);
            return createReference(`${path}.${prop}`)
        }
    });
};

// Entry point for module. Creates a reference to an Application()
var Application = function(handle) {
    return createReference('Application("' + handle + '")');
};

module.exports.Application = Application;
