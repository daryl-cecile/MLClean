it('should pass through simple well-formed whitelisted markup', function () {
    assert.equal(processHtml('<div><p>Hello <b>there</b></p></div>'), '<div><p>Hello <b>there</b></p></div>');
});
it('should respect text nodes at top level', function () {
    assert.equal(processHtml('Blah blah blah<p>Whee!</p>'), 'Blah blah blah<p>Whee!</p>');
});
it('should reject markup not whitelisted without destroying its text', function () {
    assert.equal(processHtml('<div><wiggly>Hello</wiggly></div>', { allowedTags: ['div'] }), '<div>Hello</div>');
});
it('should reject links not accepted by checking function', function () {
    assert.equal(processHtml('<div b="/intel.html">Get in <a href="mailto:john@test.com">touch</a></div>', {
        allowedAttributes: function (nodeName, attribute) {
            if (nodeName === "A" && attribute.value.indexOf('mailto:') === 0) {
                return null;
            }
            return attribute;
        }
    }), '<div b="/intel.html">Get in <a>touch</a></div>');
});
it('should use attribute result set by checking function', function () {
    assert.equal(processHtml('<div b="/intel.html">Get in touch</div>', {
        allowedAttributes: function (nodeName, attribute) {
            if (attribute.name === "b")
                attribute.value = "https://google.com";
            return attribute;
        }
    }), '<div b="https://google.com">Get in touch</div>');
});
it('should accept a custom list of allowed tags', function () {
    assert.equal(processHtml('<blue><red><green>Cheese</green></red></blue>', { allowedTags: ['blue', 'green'] }), '<blue><green>Cheese</green></blue>');
});
it('should reject attributes not whitelisted', function () {
    assert.equal(processHtml('<a href="foo.html" whizbang="whangle">foo</a>', { allowedAttributes: ['href'] }), '<a href="foo.html">foo</a>');
});
it('should cope identically with capitalized attributes and tags and should tolerate capitalized schemes', function () {
    assert.equal(processHtml('<A HREF="http://google.com">google</a><a href="HTTPS://google.com">https google</a><a href="ftp://example.com">ftp</a><a href="mailto:test@test.com">mailto</a><a href="/relative.html">relative</a><a href="javascript:alert(0)">javascript</a>', {
        disableJavaScript: true,
        allowedAttributes: { a: ['href'] }
    }), '<a href="http://google.com">google</a><a href="HTTPS://google.com">https google</a><a href="ftp://example.com">ftp</a><a href="mailto:test@test.com">mailto</a><a href="/relative.html">relative</a><a>javascript</a>');
});
it('should drop the content of script elements', function () {
    assert.equal(processHtml('<script>alert("ruhroh!");</script><p>Paragraph</p>'), '<p>Paragraph</p>');
});
it('should retain the content of fibble elements by default', function () {
    assert.equal(processHtml('<fibble>Nifty</fibble><p>Paragraph</p>', { allowedTags: ['p'] }), 'Nifty<p>Paragraph</p>');
});
it('should retain allowed tags within a fibble element if fibble is not specified for nonTextTags', function () {
    assert.equal(processHtml('<fibble>Ni<em>f</em>ty</fibble><p>Paragraph</p>', { allowedTags: ['em', 'p'] }), 'Ni<em>f</em>ty<p>Paragraph</p>');
});
it('should dump a sneaky encoded javascript url', function () {
    assert.equal(processHtml('<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">Hax</a>'), '<a>Hax</a>');
});
it('should dump an uppercase javascript url', function () {
    assert.equal(processHtml('<a href="JAVASCRIPT:alert(\'foo\')">Hax</a>'), '<a>Hax</a>');
});
it('should dump a javascript URL with a comment in the middle (probably only respected by browsers in XML data islands, but just in case someone enables those)', function () {
    assert.equal(processHtml('<a href="java<!-- -->script:alert(\'foo\')">Hax</a>'), '<a>Hax</a>');
});
it('should preserve entities as such', function () {
    assert.equal(processHtml('<a name="&lt;silly&gt;">&lt;Kapow!&gt;</a>', { allowedAttributes: true }), '<a name="&lt;silly&gt;">&lt;Kapow!&gt;</a>');
});
it('should not mess up a hashcode with a : in it', function () {
    assert.equal(processHtml('<a href="awesome.html#this:stuff">Hi</a>', { allowedAttributes: true }), '<a href="awesome.html#this:stuff">Hi</a>');
});
it('should dump character codes 1-32 before testing scheme', function () {
    assert.equal(processHtml('<a href="java\0&#14;\t\r\n script:alert(\'foo\')">Hax</a>'), '<a>Hax</a>');
});
it('should not allow a naked = sign followed by an unrelated attribute to result in one merged attribute with unescaped double quote marks', function () {
    assert.equal(processHtml('<IMG SRC= onmouseover="alert(\'XSS\');">', {
        allowedTags: ['img'],
        allowedAttributes: {
            img: ['src']
        }
    }), '<img src="onmouseover=&quot;alert(\'XSS\');&quot;">');
});
it('should not be faked out by double <', function () {
    assert.equal(processHtml('<<img src="javascript:evil"/>img src="javascript:evil"/>', { disableJavaScript: false }), '&lt;<img>img src="javascript:evil"/&gt;');
    assert.equal(processHtml('<<a href="javascript:evil"/>a href="javascript:evil"/>', { disableJavaScript: false }), '&lt;<a>a href="javascript:evil"/&gt;</a>');
});
it('should not escape inner content of script and style tags (when allowed)', function () {
    assert.equal(processHtml('<div>"normal text"</div><script>"this is code"</script>', {
        allowedTags: ['script'],
        disableJavaScript: false
    }), '"normal text"<script>"this is code"</script>');
    assert.equal(processHtml('<div>"normal text"</div><style>body { background-image: url("image.test"); }</style>', {
        allowedTags: ['style']
    }), '"normal text"<style>body { background-image: url("image.test"); }</style>');
});
it('should not unescape escapes found inside script tags', function () {
    assert.equal(processHtml('<script>alert("&quot;This is cool but just ironically so I quoted it&quot;")</script>', { allowedTags: ['script'], disableJavaScript: false }), '<script>alert("&quot;This is cool but just ironically so I quoted it&quot;")</script>');
});
it('Should encode &, <, > and where necessary, "', function () {
    assert.equal(processHtml('"< & >" <span class="&#34;test&#34;">cool</span>', {
        allowedTags: ['span'],
        allowedAttributes: {
            span: ['class']
        }
    }), '"&lt; &amp; &gt;" <span class="&quot;test&quot;">cool</span>');
});
