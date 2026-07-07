// Auth token is kept in sessionStorage (cleared when the tab closes) rather than
// localStorage, to limit how long a stolen token via XSS would remain usable.
const Auth = {
    TOKEN_KEY: 'aq_token',
    LOGIN_TIME_KEY: 'aq_login_time',

    getToken: function () {
        return sessionStorage.getItem(Auth.TOKEN_KEY);
    },

    setToken: function (token) {
        sessionStorage.setItem(Auth.TOKEN_KEY, token);
        sessionStorage.setItem(Auth.LOGIN_TIME_KEY, new Date().toISOString());
    },

    getLoginTime: function () {
        const iso = sessionStorage.getItem(Auth.LOGIN_TIME_KEY);
        return iso ? new Date(iso) : null;
    },

    clear: function () {
        sessionStorage.removeItem(Auth.TOKEN_KEY);
        sessionStorage.removeItem(Auth.LOGIN_TIME_KEY);
    },

    isLoggedIn: function () {
        return !!Auth.getToken();
    },

    logout: function () {
        Auth.clear();
        window.location.href = '/login.html';
    },

    // Call at the top of any page that requires a logged-in session.
    requireLogin: function () {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/login.html';
        }
    }
};

// Pages that need the redirect to happen before first paint (to avoid a
// flash of protected content) load this script in <head> with
// data-guard="true" instead of calling Auth.requireLogin() separately.
if (document.currentScript && document.currentScript.dataset.guard === 'true') {
    Auth.requireLogin();
}
