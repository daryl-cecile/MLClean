var MLNodeType;
(function (MLNodeType) {
    MLNodeType[MLNodeType["COMMENT"] = 8] = "COMMENT";
    MLNodeType[MLNodeType["ELEMENT"] = 1] = "ELEMENT";
    MLNodeType[MLNodeType["STRING"] = 3] = "STRING";
})(MLNodeType || (MLNodeType = {}));
class MLCleaner {
    clean(content, settings) {
        settings = this.standardizeSettings(settings);
        let vDoc = document.implementation.createHTMLDocument("vDoc - MLCleaner v" + MLCleaner.Version);
        let templ = vDoc.createElement("template");
        let final = "";
        vDoc.body.appendChild(templ);
        // take out sneaky chars with code 0-32 
        content = content.split('').filter(c => c.charCodeAt(0) > 31).join('');
        content = content.replace(/((?:&#)[0]*(?:3[012]|[12][0-9]|[0-9])[^0-9];*)/gm, '');
        templ.innerHTML = content;
        templ.content.childNodes.forEach(c => {
            if (c.nodeType === MLNodeType.COMMENT) {
                if (settings.stripComments === true) {
                    templ.content.removeChild(c);
                    return;
                }
            }
            else if (c.nodeType === MLNodeType.ELEMENT) {
                let newNode = (c.cloneNode(true));
                if (settings.disableJavaScript === true && c.nodeName.toLowerCase() === "script") {
                    templ.content.removeChild(c);
                    return;
                }
                // attributes
                for (let i = newNode.attributes.length - 1; i >= 0; i--) {
                    let attr = newNode.attributes[i];
                    let aName = attr.name;
                    let checkedAttr = this.checkCanAcceptAttribute(newNode.nodeName, attr, settings);
                    if (checkedAttr === null) {
                        newNode.removeAttribute(aName);
                    }
                    else {
                        let k = MLCleaner.encodeHtmlTags(checkedAttr.value);
                        let q = MLCleaner.decodeHtmlTags(checkedAttr.value);
                        attr.value = k;
                        attr.value = checkedAttr.value;
                    }
                }
                if (Array.isArray(settings.allowedTags)) {
                    if (settings.allowedTags.length === 0 || settings.allowedTags.indexOf(c.nodeName.toLowerCase()) === -1) {
                        //not in array of accepted tags
                        let nextSib = c.nextSibling;
                        newNode.childNodes.forEach(cc => {
                            let n;
                            switch (cc.nodeType) {
                                case MLNodeType.COMMENT:
                                    n = vDoc.createComment(cc.nodeValue);
                                    c.parentNode.insertBefore(n, nextSib);
                                    nextSib = n.nextSibling;
                                    break;
                                case MLNodeType.ELEMENT:
                                    n = this.stringToNode(this.clean(cc.outerHTML, settings))[0];
                                    c.parentNode.insertBefore(n, nextSib);
                                    nextSib = n.nextSibling;
                                    break;
                                case MLNodeType.STRING:
                                    n = vDoc.createTextNode(cc.nodeValue);
                                    c.parentNode.insertBefore(n, nextSib);
                                    nextSib = n.nextSibling;
                                    break;
                            }
                        });
                        templ.content.removeChild(c);
                        return;
                    }
                }
                else if (MLCleaner.Helpers.isFunction(settings.allowedTags)) {
                    if (settings.allowedTags(c) === false) {
                        //not accepted by function
                        templ.content.removeChild(c);
                        return;
                    }
                }
                else if (MLCleaner.Helpers.isBoolean(settings.allowedTags)) {
                    if (settings.allowedTags === false) {
                        //dont accept any tags
                        templ.content.removeChild(c);
                        return;
                    }
                }
                if (MLCleaner.TagsContentIgnoreEscapes.indexOf(newNode.nodeName.toLowerCase()) > -1) {
                    newNode.innerHTML = newNode.innerHTML;
                }
                else {
                    newNode.innerHTML = this.clean(newNode.innerHTML, settings);
                }
                templ.content.replaceChild(newNode, c);
            }
            else if (c.nodeType === MLNodeType.STRING) {
                // do nothing 
            }
        });
        // if (settings.decodeEntities === true){
        final = templ.innerHTML;
        // }
        // else{
        //     final = MLCleaner.encodeHtmlTags(templ.innerHTML);
        // }
        if (settings.disableDoubleEncodeAmpersands === true) {
            final = final.replace(/(?:&amp;)([a-z#0-9A-Z]+;)/gm, '&$1');
        }
        // check encoded
        if (settings.attemptHTMLDecode === true) {
            final = final.replace(/(?:&amp;)/g, '&');
            final = final.replace(/(?:&lt;)/g, '<');
            final = final.replace(/(?:&gt;)/g, '>');
        }
        return final;
    }
    checkCanAcceptAttribute(nodeName, attr, settings) {
        let allowedAttr = settings.allowedAttributes;
        // check if attr is; event-based with js disabled OR url with javascript protocol with js disabled 
        if (settings.disableJavaScript === true) {
            if (attr.name.toLowerCase().indexOf("on") === 0) {
                return null;
            }
            if (["srcset", "archive"].indexOf(attr.name.toLowerCase()) > -1 || (attr.name.toLowerCase() === "content" && nodeName.toLowerCase() === "meta")) {
                let partsW = attr.value.split(' ').filter(p => p.replace(/\s/g, '').toLowerCase().indexOf('javascript:') === 0);
                let partsC = attr.value.split(',').filter(p => p.replace(/\s/g, '').toLowerCase().indexOf('javascript:') === 0);
                if (partsW.length > 0 || partsC.length > 0)
                    return null;
            }
            if (MLCleaner.URLCapableAttributeNames.indexOf(attr.name.toLowerCase()) > -1 && attr.value.replace(/\s/g, '').toLowerCase().indexOf('javascript:') === 0) {
                return null;
            }
            // check same as above for css that accepts url() as value and has javascript protocol
            if (attr.name.toLowerCase() === "style") {
                let nodeStyles = this.parseCSS(attr.value);
                let srcs = Array.from(nodeStyles.values()).filter(k => k.indexOf("url(javascript:") === 0);
                if (srcs.length > 0)
                    return null;
            }
        }
        if (Array.isArray(allowedAttr)) {
            if (allowedAttr.indexOf(attr.name) > -1) {
                return attr;
            }
            return null;
        }
        else if (MLCleaner.Helpers.isBoolean(allowedAttr)) {
            if (allowedAttr === true) {
                return attr;
            }
            return null;
        }
        else if (MLCleaner.Helpers.isFunction(allowedAttr)) {
            let r = allowedAttr(nodeName, attr);
            if (r !== null && r !== false) {
                return r;
            }
            return null;
        }
        else if (MLCleaner.Helpers.isMap(allowedAttr)) {
            let attrMap = allowedAttr;
            if (attrMap.get(nodeName.toLowerCase()).indexOf(attr.name) > -1) {
                return attr;
            }
            return null;
        }
        return null;
    }
    static decodeHtmlTags(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.innerText;
    }
    static encodeHtmlTags(htmlString) {
        var div = document.createElement('div');
        div.innerText = htmlString.trim();
        return div.innerHTML;
    }
    stringToNode(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.childNodes;
    }
    parseCSS(styleContent) {
        let doc = document.implementation.createHTMLDocument("");
        let div = doc.createElement("div");
        let stl = new Map();
        div.setAttribute('style', styleContent);
        for (let i = 0; i < div.style.length; i++) {
            stl.set(div.style[i], div.style[div.style[i]]);
        }
        return stl;
    }
    ;
    standardizeSettings(settings) {
        let defaultSettings = {
            allowedTags: ["b", "i", "em", "strong", "u"],
            allowedAttributes: false,
            disableJavaScript: true,
            stripComments: true,
            attemptHTMLDecode: false,
            disableDoubleEncodeAmpersands: true,
            decodeEntities: true
        };
        if (!settings)
            settings = defaultSettings;
        else {
            settings = Object.assign({}, defaultSettings, settings);
            if (Array.isArray(settings.allowedAttributes) === false &&
                MLCleaner.Helpers.isBoolean(settings.allowedAttributes) === false &&
                MLCleaner.Helpers.isFunction(settings.allowedAttributes) === false &&
                MLCleaner.Helpers.isMap(settings.allowedAttributes) === false &&
                MLCleaner.Helpers.isObject(settings.allowedAttributes) === true) {
                settings.allowedAttributes = new Map(Object.entries(settings.allowedAttributes));
            }
        }
        return settings;
    }
}
MLCleaner.Version = "0.1.32";
MLCleaner.URLCapableAttributeNames = ["lowsrc", "dynsrc", "href", "codebase", "cite", "background", "action", "longdesc", "src", "profile", "usemap", "classid", "data", "formaction", "icon", "manifest", "poster"];
MLCleaner.TagsContentIgnoreEscapes = ["script", "style"];
MLCleaner.Helpers = {
    isFunction: obj => !!(obj && obj.constructor && obj.call && obj.apply),
    isBoolean: obj => (obj === true || obj === false),
    isMap: obj => (obj instanceof Map),
    isObject: obj => (obj !== null && typeof obj === "object"),
    decodeHtmlTags: MLCleaner.decodeHtmlTags,
    encodeHtmlTags: MLCleaner.encodeHtmlTags
};
