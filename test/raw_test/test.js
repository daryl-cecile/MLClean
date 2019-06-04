let c = new MLCleaner();
// let v = c.clean("<a href='#'>Test anchors </a>");
let subjects = [
    "!<__proto__>!",
    "&#14;&#13;&#11;",
    "!<textarea>&lt;/textarea&gt;&lt;svg/onload=prompt`xs`&gt;</textarea>!",
    '<<img src="javascript:evil"/>img src="javascript:evil"/>',
    '<a href="java\0&#14;\t\r\n script:alert(\'foo\')">Hax</a>',
    '<a href="java&#0000001script:alert(\'foo\')">Hax</a>',
    '<p><!-- Blah blah -->Whee</p>',
    '<!-- Blah blah -->',
    '<p><a href="js:a">click</a><span>that</span><b>nna</b></p>'
];
console.log((new Date()).getTime());
subjects.forEach(vx => {
    console.group(vx);
    let v = c.clean(vx, {
        allowedTags: ['img', 'a']
    });
    console.log(v);
    console.log(v.length);
    console.groupEnd();
});
