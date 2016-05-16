let initAnimations = function(){
    $.fn.extend({
        animateCss: function(animationName){
            let animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(this).addClass('animated ' + animationName).one(animationEnd, function(){
                $(this).removeClass('animated ' + animationName);
            });
        }
    });
};

export { initAnimations }