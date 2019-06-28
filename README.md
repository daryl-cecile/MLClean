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
