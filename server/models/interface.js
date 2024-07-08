'use strict';

module.exports = function (Interface) {
    Interface.observe('before save', (ctx, done) => {
        if (ctx.instance) {
            ctx.instance.content = `${ctx.instance.location} ${ctx.instance.action}`;
        } else if (ctx.currentInstance) {
            ctx.currentInstance.content = `${ctx.currentInstance.location} ${ctx.currentInstance.action}`;
        }

        done();
    });
};
