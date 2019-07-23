# MLClean

MLClean is an HTML cleaner/sanitizer.

Usage is simple:
```typescript
let c = new MLCleaner();

let cleanedContentA = c.clean(inputA,{
  disableJavaScript:false
});

let cleanedContentB = c.clean(inputB,{
  allowedTags: [ 'img', 'a', 'p' ],
});
```

---

## Clean Options

To perform a sanitization on a piece of input text, simply call the `clean` method, passing in the input string and options as parameters.

__allowedTags__
  - allowedTags: Array\<String> 
    - Takes in a collection of strings specifying the tag names to allow
    - E.g. `["a","p","img"]` will strip all tags not matching these

  - allowedTags: Boolean
    - Takes in boolean to represent whether to allow tags or not
    - E.g. `true` will allow all tags, `false` will strip all tags

  - allowedTags: Function<Node, Boolean> 
    - Takes in a function that receives the node being checked as parameter
    - Returning false in the function will cause the tag to be stripped
    - E.g. ```function(node){ return node.tagName === 'a' }``` will strip all tags that dont have the tagName of _'a'_


__allowedAttributes__
  - allowedAttributes: Map< String, Array\<String> > 
    - Takes in a key-value pair
    - The key specifies which to apply the filter to, based on tagName
    - The array should be a list of attribute names allowed for each key
    - E.g. `{ a : ["href","target"] , p : ["class"] }` will strip all attributes not called 'class' from paragraph tags, and remove attributes not called 'href' and 'target' from anchor tags

  - allowedAttributes: Array\<String> 
    - Takes in a collection of strings specifying the attribute names to allow
    - E.g. `["href","class","target"]` will strip all attributes not matching these
  
  - allowedAttributes: Boolean 
    - Takes in boolean to represent whether to allow attributes or not
    - E.g. `true` will allow all attributes, `false` will strip all attributes

  - allowedAttributes: Function<String, String, Boolean> 
    - Takes in a function that receives the tagName and attributeName of the attribute being checked as parameter
    - Returning false in the function will cause the attribute to be stripped
    - E.g. ```function(nodeName,attrName){ return attrName.startsWith('data') }``` will strip all attributes that dont start with _'data'_

__disableJavaScript__
  - disableJavaScript: Boolean _optional_
    - Setting this to false will disable all JavaScript from attribute-based events.
    - If enabled, script tags will be stripped regardless of 'allowedTags' settings

__disableDoubleEncodeAmpersands__
  - disableDoubleEncodeAmpersands: Boolean _optional_
    - Setting this to true will cause the sanitizer to attempt to prevent re-encoding already encoded strings, to try and prevent encoding characters like ampersands that are part of already encoded characters

__stripComments__
  - stripComments: Boolean _optional_
    - Setting to true will make the sanitizer attempt to strip comments

__attemptHTMLDecode__
  - attemptHTMLDecode: Boolean _optional_
    - Will attempt to convert HTML-encoded values back into a visually clear, decoded value
    - E.g. `&lt;abc&gt;hi&lt;/abc&gt;` will be converted to `<abc>hi</abc>`