document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");

    loginBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                console.log("User signed in:", result.user);
                window.location.href = "homepage.html";
            })
            .catch((error) => {
                console.error("Login error:", error);
            });
    });
});
