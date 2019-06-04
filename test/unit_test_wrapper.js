let assert;
const it = function (name, test) {
    QUnit.test(name, (l_assert) => {
        assert = l_assert;
        test(assert);
    });
};
const processHtml = function (input, options) {
    let c = new MLCleaner();
    if (!options)
        options = {};
    let defaultOpt = Object.assign({}, {
        allowedTags: true
    }, options);
    return c.clean(input, defaultOpt);
};
