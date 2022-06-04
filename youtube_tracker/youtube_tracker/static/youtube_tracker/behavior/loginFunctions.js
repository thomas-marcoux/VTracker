function show(pass, icon) {
    pass.setAttribute('type', 'text');
    pass.setAttribute('data-type', 'text');
    icon.classList.toggle('hide-pass');
}

function hide(pass, icon) {
    pass.setAttribute('type', 'password');
    pass.setAttribute('data-type', 'password');
    icon.classList.toggle('hide-pass');
}

var pwShown = false;

$(function() {
    var eyeIcon = document.getElementById("eye");
    var pass = document.getElementById('pass');

    if (pass && eyeIcon) {
        eyeIcon.addEventListener("click", function () {
            if (!pwShown) {
                pwShown = !pwShown;
                show(pass, eyeIcon);
            }
            else {
                pwShown = !pwShown;
                hide(pass, eyeIcon);
            }
        }, false);
    }
});
