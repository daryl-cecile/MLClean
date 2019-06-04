declare const QUnit;

let assert;

const it = function(name:string,test:Function){
    QUnit.test(name,(l_assert)=>{
        assert = l_assert;
        test(assert);
    });
};

const processHtml = function(input:string,options?){
    let c = new MLCleaner();

    if (!options) options = {};
    let defaultOpt = Object.assign({},{
        allowedTags:true
    },options);

    return c.clean(input,defaultOpt);
};