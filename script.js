/* =========================================================
   NEXORA COMPLETE FIREBASE + CLOUDINARY SCRIPT
   TEXT + IMAGE + VIDEO CHAT

   Firebase:
   - Authentication
   - Firestore

   Cloudinary:
   - Image uploads
   - Video uploads

   Firebase Storage is NOT used.
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyDRRmgBLu91ITBAROhV9r03tArxGc09RK0",

    authDomain:
        "nexora-f07ed.firebaseapp.com",

    projectId:
        "nexora-f07ed",

    storageBucket:
        "nexora-f07ed.firebasestorage.app",

    messagingSenderId:
        "212082909083",

    appId:
        "1:212082909083:web:10aaa93277d2518c1f8b3e",

    measurementId:
        "G-M0S88JER3L"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

const CLOUDINARY_CLOUD_NAME =
    "rbe8ydqz";


const CLOUDINARY_UPLOAD_PRESET =
    "nexora-uploads";


/*
 * We use the AUTO endpoint.
 *
 * Cloudinary automatically detects:
 * image
 * video
 * other supported media
 */

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;

let selectedUser = null;

let unsubscribeMessages = null;

let unsubscribeUsers = null;

let allNexoraUsers = [];

let selectedMediaFile = null;


/* =========================================================
   PAGE NAVIGATION
========================================================= */

window.openPage = function(pageId){

    document.querySelectorAll(".page").forEach(
        page => page.classList.remove("active")
    );


    const page =
        document.getElementById(pageId);


    if(page){
        page.classList.add("active");
    }


    document.querySelectorAll(".nav-item").forEach(
        item => item.classList.remove("active")
    );


    if(pageId === "homePage"){

        document.getElementById("navHome")
            ?.classList.add("active");

    }


    if(pageId === "chatPage"){

        document.getElementById("navChat")
            ?.classList.add("active");

    }


    if(pageId === "gamesPage"){

        document.getElementById("navGames")
            ?.classList.add("active");

    }


    if(pageId === "nexPage"){

        document.getElementById("navNex")
            ?.classList.add("active");

    }


    if(pageId === "profilePage"){

        document.getElementById("navProfile")
            ?.classList.add("active");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

};


/* =========================================================
   MESSAGE BOX
========================================================= */

function showMessage(
    text,
    type = "info"
){

    const box =
        document.getElementById("message");


    if(!box){
        return;
    }


    box.textContent =
        text;


    box.className =
        type;

}


/* =========================================================
   FIREBASE ERROR HANDLER
========================================================= */

function showFirebaseError(error){

    console.error(error);


    let message =
        "Something went wrong.";


    switch(error?.code){

        case "auth/email-already-in-use":

            message =
                "This email is already registered.";

            break;


        case "auth/invalid-email":

            message =
                "Please enter a valid email address.";

            break;


        case "auth/weak-password":

            message =
                "Password is too weak. Use at least 6 characters.";

            break;


        case "auth/user-not-found":

            message =
                "No Nexora account was found with this email.";

            break;


        case "auth/wrong-password":

            message =
                "Incorrect password.";

            break;


        case "auth/invalid-credential":

            message =
                "Email or password is incorrect.";

            break;


        case "auth/too-many-requests":

            message =
                "Too many attempts. Please try again later.";

            break;


        case "permission-denied":

            message =
                "Permission denied. Check your Firebase rules.";

            break;


        default:

            if(error?.message){
                message = error.message;
            }

    }


    showMessage(
        message,
        "error"
    );

}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

window.createAccount =
    async function(){

        const name =
            document.getElementById("name")
            ?.value.trim();


        const email =
            document.getElementById("email")
            ?.value.trim();


        const password =
            document.getElementById("password")
            ?.value;


        if(!name){

            showMessage(
                "Please enter your name.",
                "error"
            );

            return;
        }


        if(!email){

            showMessage(
                "Please enter your email.",
                "error"
            );

            return;
        }


        if(!password || password.length < 6){

            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );

            return;
        }


        try{

            showMessage(
                "Creating your Nexora account...",
                "info"
            );


            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {

                    uid:
                        user.uid,

                    name:
                        name,

                    email:
                        email,

                    online:
                        true,

                    nex:
                        0,

                    createdAt:
                        serverTimestamp(),

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


            showMessage(
                "🎉 Nexora account created successfully!",
                "success"
            );


            const nameInput =
                document.getElementById("name");


            const passwordInput =
                document.getElementById("password");


            if(nameInput){
                nameInput.value = "";
            }


            if(passwordInput){
                passwordInput.value = "";
            }


        }catch(error){

            showFirebaseError(error);

        }

    };


/* =========================================================
   LOGIN
========================================================= */

window.login =
    async function(){

        const email =
            document.getElementById("email")
            ?.value.trim();


        const password =
            document.getElementById("password")
            ?.value;


        if(!email){

            showMessage(
                "Please enter your email.",
                "error"
            );

            return;
        }


        if(!password){

            showMessage(
                "Please enter your password.",
                "error"
            );

            return;
        }


        try{

            showMessage(
                "Logging into Nexora...",
                "info"
            );


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            showMessage(
                "✅ Login successful!",
                "success"
            );


            const passwordInput =
                document.getElementById("password");


            if(passwordInput){
                passwordInput.value = "";
            }


        }catch(error){

            showFirebaseError(error);

        }

    };


/* =========================================================
   LOGOUT
========================================================= */

window.logout =
    async function(){

        try{

            if(currentUser){

                await setDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),
                    {

                        online:
                            false,

                        lastSeen:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }


            await signOut(auth);


            showMessage(
                "You have been logged out.",
                "success"
            );


        }catch(error){

            showFirebaseError(error);

        }

    };


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async function(user){

        currentUser =
            user;


        const loginRequired =
            document.getElementById(
                "chatLoginRequired"
            );


        const chatSystem =
            document.getElementById(
                "chatSystem"
            );


        if(user){

            /* =========================================
               LOGGED IN
            ========================================= */

            const accountForm =
                document.getElementById(
                    "accountForm"
                );


            const loggedProfile =
                document.getElementById(
                    "loggedProfile"
                );


            if(accountForm){
                accountForm.style.display = "none";
            }


            if(loggedProfile){
                loggedProfile.style.display = "block";
            }


            const name =
                user.displayName ||
                "Nexora User";


            const profileName =
                document.getElementById(
                    "profileName"
                );


            if(profileName){

                profileName.textContent =
                    name;

            }


            const profileEmail =
                document.getElementById(
                    "profileEmail"
                );


            if(profileEmail){

                profileEmail.textContent =
                    user.email || "";

            }


            const profileAvatar =
                document.getElementById(
                    "profileAvatar"
                );


            if(profileAvatar){

                profileAvatar.textContent =
                    name
                    .charAt(0)
                    .toUpperCase();

            }


            if(loginRequired){

                loginRequired.style.display =
                    "none";

            }


            if(chatSystem){

                chatSystem.style.display =
                    "block";

            }


            const chatStatus =
                document.getElementById(
                    "chatStatus"
                );


            if(chatStatus){

                chatStatus.textContent =
                    "🟢 You are online";

            }


            /* =========================================
               SAVE USER
            ========================================= */

            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {

                    uid:
                        user.uid,

                    name:
                        name,

                    email:
                        user.email,

                    online:
                        true,

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


            /* =========================================
               LOAD NEX
            ========================================= */

            loadNex();


            /* =========================================
               USERS
            ========================================= */

            listenForUsers();


            /* =========================================
               CREATE MEDIA CONTROLS
            ========================================= */

            createMediaControls();


        }else{

            /* =========================================
               LOGGED OUT
            ========================================= */

            const accountForm =
                document.getElementById(
                    "accountForm"
                );


            const loggedProfile =
                document.getElementById(
                    "loggedProfile"
                );


            if(accountForm){

                accountForm.style.display =
                    "block";

            }


            if(loggedProfile){

                loggedProfile.style.display =
                    "none";

            }


            if(loginRequired){

                loginRequired.style.display =
                    "block";

            }


            if(chatSystem){

                chatSystem.style.display =
                    "none";

            }


            const chatStatus =
                document.getElementById(
                    "chatStatus"
                );


            if(chatStatus){

                chatStatus.textContent =
                    "Sign in to start chatting.";

            }


            if(unsubscribeMessages){

                unsubscribeMessages();

                unsubscribeMessages = null;

            }


            if(unsubscribeUsers){

                unsubscribeUsers();

                unsubscribeUsers = null;

            }


            selectedUser =
                null;


            selectedMediaFile =
                null;

        }

    }
);


/* =========================================================
   CREATE IMAGE / VIDEO CONTROLS
========================================================= */

function createMediaControls(){

    const area =
        document.querySelector(
            ".chat-input-area"
        );


    if(!area){
        return;
    }


    if(
        document.getElementById(
            "nexoraMediaControls"
        )
    ){

        return;

    }


    /* =========================================
       FILE INPUT
    ========================================= */

    const fileInput =
        document.createElement(
            "input"
        );


    fileInput.type =
        "file";


    fileInput.id =
        "nexoraMediaInput";


    fileInput.accept =
        "image/*,video/*";


    fileInput.style.display =
        "none";


    fileInput.addEventListener(
        "change",
        function(){

            if(
                this.files &&
                this.files[0]
            ){

                selectedMediaFile =
                    this.files[0];


                showSelectedMedia();

            }

        }
    );


    document.body.appendChild(
        fileInput
    );


    /* =========================================
       CONTROLS
    ========================================= */

    const controls =
        document.createElement(
            "div"
        );


    controls.id =
        "nexoraMediaControls";


    controls.style.display =
        "flex";


    controls.style.alignItems =
        "center";


    controls.style.gap =
        "6px";


    /* =========================================
       IMAGE BUTTON
    ========================================= */

    const imageButton =
        document.createElement(
            "button"
        );


    imageButton.type =
        "button";


    imageButton.textContent =
        "🖼️";


    imageButton.title =
        "Send image";


    styleMediaButton(
        imageButton
    );


    imageButton.onclick =
        function(){

            fileInput.accept =
                "image/*";


            fileInput.click();

        };


    /* =========================================
       VIDEO BUTTON
    ========================================= */

    const videoButton =
        document.createElement(
            "button"
        );


    videoButton.type =
        "button";


    videoButton.textContent =
        "🎥";


    videoButton.title =
        "Send video";


    styleMediaButton(
        videoButton
    );


    videoButton.onclick =
        function(){

            fileInput.accept =
                "video/*";


            fileInput.click();

        };


    controls.appendChild(
        imageButton
    );


    controls.appendChild(
        videoButton
    );


    /* =========================================
       INSERT BEFORE CHAT INPUT
    ========================================= */

    const input =
        document.getElementById(
            "chatInput"
        );


    if(input){

        area.insertBefore(
            controls,
            input
        );

    }else{

        area.prepend(
            controls
        );

    }

}


/* =========================================================
   STYLE MEDIA BUTTON
========================================================= */

function styleMediaButton(button){

    button.style.width =
        "48px";


    button.style.height =
        "48px";


    button.style.border =
        "none";


    button.style.borderRadius =
        "50%";


    button.style.background =
        "#edf3ef";


    button.style.fontSize =
        "21px";


    button.style.cursor =
        "pointer";

}


/* =========================================================
   SHOW SELECTED MEDIA
========================================================= */

function showSelectedMedia(){

    if(!selectedMediaFile){
        return;
    }


    const existing =
        document.getElementById(
            "selectedMediaPreview"
        );


    if(existing){
        existing.remove();
    }


    const preview =
        document.createElement(
            "div"
        );


    preview.id =
        "selectedMediaPreview";


    preview.style.position =
        "fixed";


    preview.style.left =
        "15px";


    preview.style.right =
        "15px";


    preview.style.bottom =
        "100px";


    preview.style.background =
        "white";


    preview.style.padding =
        "12px";


    preview.style.borderRadius =
        "18px";


    preview.style.boxShadow =
        "0 5px 20px rgba(0,0,0,.2)";


    preview.style.zIndex =
        "5000";


    const name =
        document.createElement(
            "div"
        );


    name.textContent =
        selectedMediaFile.name;


    name.style.fontWeight =
        "bold";


    name.style.marginBottom =
        "8px";


    name.style.wordBreak =
        "break-word";


    const size =
        document.createElement(
            "div"
        );


    size.textContent =
        formatFileSize(
            selectedMediaFile.size
        );


    size.style.fontSize =
        "13px";


    size.style.color =
        "#65706b";


    const cancel =
        document.createElement(
            "button"
        );


    cancel.textContent =
        "✕ Cancel";


    cancel.style.marginTop =
        "10px";


    cancel.style.border =
        "none";


    cancel.style.background =
        "#c62828";


    cancel.style.color =
        "white";


    cancel.style.padding =
        "8px 12px";


    cancel.style.borderRadius =
        "10px";


    cancel.onclick =
        function(){

            selectedMediaFile =
                null;


            preview.remove();


            const input =
                document.getElementById(
                    "nexoraMediaInput"
                );


            if(input){

                input.value =
                    "";

            }

        };


    preview.appendChild(
        name
    );


    preview.appendChild(
        size
    );


    preview.appendChild(
        cancel
    );


    document.body.appendChild(
        preview
    );

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(bytes){

    if(bytes < 1024){

        return (
            bytes +
            " B"
        );

    }


    if(
        bytes <
        1024 * 1024
    ){

        return (
            (
                bytes / 1024
            ).toFixed(1) +
            " KB"
        );

    }


    if(
        bytes <
        1024 * 1024 * 1024
    ){

        return (
            (
                bytes /
                (
                    1024 *
                    1024
                )
            ).toFixed(1) +
            " MB"
        );

    }


    return (
        (
            bytes /
            (
                1024 *
                1024 *
                1024
            )
        ).toFixed(1) +
        " GB"
    );

}


/* =========================================================
   USER LISTENER
========================================================= */

function listenForUsers(){

    if(unsubscribeUsers){

        unsubscribeUsers();

    }


    const usersRef =
        collection(
            db,
            "users"
        );


    const q =
        query(
            usersRef,
            limit(50)
        );


    unsubscribeUsers =
        onSnapshot(
            q,

            function(snapshot){

                allNexoraUsers =
                    [];


                snapshot.forEach(
                    function(item){

                        const data =
                            item.data();


                        if(
                            currentUser &&
                            data.uid !==
                            currentUser.uid
                        ){

                            allNexoraUsers.push(
                                data
                            );

                        }

                    }
                );


                window.allNexoraUsers =
                    allNexoraUsers;

            },

            function(error){

                console.error(
                    "User listener:",
                    error
                );

            }
        );

}


/* =========================================================
   SEARCH USERS
========================================================= */

window.searchUsers =
    function(){

        const input =
            document.getElementById(
                "userSearch"
            );


        if(!input){
            return;
        }


        const text =
            input.value
                .trim()
                .toLowerCase();


        if(
            !window.allNexoraUsers
        ){

            return;

        }


        if(!text){

            renderUserResults([]);

            return;

        }


        const results =
            window.allNexoraUsers.filter(
                function(user){

                    const name =
                        (
                            user.name ||
                            ""
                        ).toLowerCase();


                    const email =
                        (
                            user.email ||
                            ""
                        ).toLowerCase();


                    return(
                        name.includes(text) ||
                        email.includes(text)
                    );

                }
            );


        renderUserResults(
            results
        );

    };


/* =========================================================
   RENDER USERS
========================================================= */

function renderUserResults(users){

    const container =
        document.getElementById(
            "searchResults"
        );


    if(!container){
        return;
    }


    container.innerHTML =
        "";


    users.forEach(
        function(user){

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "user-result";


            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "avatar";


            avatar.textContent =
                (
                    user.name ||
                    "N"
                )
                .charAt(0)
                .toUpperCase();


            const info =
                document.createElement(
                    "div"
                );


            info.style.flex =
                "1";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "user-result-name";


            name.textContent =
                user.name ||
                "Nexora User";


            const email =
                document.createElement(
                    "div"
                );


            email.className =
                "user-result-email";


            email.textContent =
                user.email ||
                "";


            info.appendChild(
                name
            );


            info.appendChild(
                email
            );


            if(user.online){

                const dot =
                    document.createElement(
                        "div"
                    );


                dot.className =
                    "online-dot";


                info.appendChild(
                    dot
                );

            }


            row.appendChild(
                avatar
            );


            row.appendChild(
                info
            );


            row.onclick =
                function(){

                    selectUser(
                        user
                    );

                };


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   SELECT USER
========================================================= */

function selectUser(user){

    selectedUser =
        user;


    const results =
        document.getElementById(
            "searchResults"
        );


    if(results){

        results.innerHTML =
            "";

    }


    const search =
        document.getElementById(
            "userSearch"
        );


    if(search){

        search.value =
            user.name ||
            "";

    }


    const status =
        document.getElementById(
            "chatStatus"
        );


    if(status){

        status.textContent =
            "💬 Chatting with " +
            (
                user.name ||
                "Nexora User"
            );

    }


    loadMessages();

}


/* =========================================================
   CONVERSATION ID
========================================================= */

function getConversationId(){

    if(
        !currentUser ||
        !selectedUser
    ){

        return null;

    }


    const ids = [

        currentUser.uid,

        selectedUser.uid

    ];


    ids.sort();


    return ids.join(
        "_"
    );

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

function loadMessages(){

    if(
        !currentUser ||
        !selectedUser
    ){

        return;

    }


    if(unsubscribeMessages){

        unsubscribeMessages();

    }


    const conversationId =
        getConversationId();


    if(!conversationId){
        return;
    }


    const messagesRef =
        collection(
            db,
            "conversations",
            conversationId,
            "messages"
        );


    const q =
        query(
            messagesRef,

            orderBy(
                "createdAt",
                "asc"
            ),

            limit(200)
        );


    unsubscribeMessages =
        onSnapshot(
            q,

            function(snapshot){

                const chatWindow =
                    document.getElementById(
                        "chatWindow"
                    );


                if(!chatWindow){
                    return;
                }


                chatWindow.innerHTML =
                    "";


                if(snapshot.empty){

                    chatWindow.innerHTML = `

                        <div class="chat-empty">

                            <div style="font-size:50px;">
                                💬
                            </div>

                            <p>
                                No messages yet.
                                Say hello!
                            </p>

                        </div>

                    `;

                    return;

                }


                snapshot.forEach(
                    function(item){

                        renderMessage(
                            item.id,
                            item.data()
                        );

                    }
                );


                chatWindow.scrollTop =
                    chatWindow.scrollHeight;

            },

            function(error){

                console.error(
                    "Message listener:",
                    error
                );


                const chatWindow =
                    document.getElementById(
                        "chatWindow"
                    );


                if(chatWindow){

                    chatWindow.innerHTML = `

                        <div class="chat-empty">

                            Unable to load messages.

                            <br><br>

                            ${escapeHtml(
                                error.message ||
                                ""
                            )}

                        </div>

                    `;

                }

            }
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(text){

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text || "";


    return div.innerHTML;

}


/* =========================================================
   RENDER MESSAGE
========================================================= */

function renderMessage(
    id,
    data
){

    const chatWindow =
        document.getElementById(
            "chatWindow"
        );


    if(!chatWindow){
        return;
    }


    const row =
        document.createElement(
            "div"
        );


    const mine =
        data.senderId ===
        currentUser.uid;


    row.className =
        "message-row" +
        (
            mine
            ? " mine"
            : ""
        );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    /* =========================================
       TEXT MESSAGE
    ========================================= */

    if(
        data.type === "text" ||
        !data.type
    ){

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            data.text ||
            "";


        bubble.appendChild(
            text
        );

    }


    /* =========================================
       IMAGE MESSAGE
    ========================================= */

    if(
        data.type === "image"
    ){

        const image =
            document.createElement(
                "img"
            );


        image.src =
            data.fileUrl;


        image.alt =
            "Nexora image";


        image.loading =
            "lazy";


        image.style.display =
            "block";


        image.style.maxWidth =
            "100%";


        image.style.width =
            "auto";


        image.style.maxHeight =
            "400px";


        image.style.borderRadius =
            "14px";


        image.style.cursor =
            "pointer";


        image.onclick =
            function(){

                window.open(
                    data.fileUrl,
                    "_blank"
                );

            };


        image.onerror =
            function(){

                image.alt =
                    "Unable to load image";

            };


        bubble.appendChild(
            image
        );


        if(data.text){

            const caption =
                document.createElement(
                    "div"
                );


            caption.textContent =
                data.text;


            caption.style.marginTop =
                "8px";


            bubble.appendChild(
                caption
            );

        }

    }


    /* =========================================
       VIDEO MESSAGE
    ========================================= */

    if(
        data.type === "video"
    ){

        const video =
            document.createElement(
                "video"
            );


        video.src =
            data.fileUrl;


        video.controls =
            true;


        video.playsInline =
            true;


        video.preload =
            "metadata";


        video.style.display =
            "block";


        video.style.width =
            "100%";


        video.style.maxWidth =
            "420px";


        video.style.maxHeight =
            "400px";


        video.style.borderRadius =
            "14px";


        bubble.appendChild(
            video
        );


        if(data.text){

            const caption =
                document.createElement(
                    "div"
                );


            caption.textContent =
                data.text;


            caption.style.marginTop =
                "8px";


            bubble.appendChild(
                caption
            );

        }

    }


    /* =========================================
       TIME
    ========================================= */

    const time =
        document.createElement(
            "div"
        );


    time.className =
        "message-time";


    time.textContent =
        formatTime(
            data.createdAt
        );


    bubble.appendChild(
        time
    );


    /* =========================================
       DELETE OWN MESSAGE
    ========================================= */

    if(mine){

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "delete-message";


        deleteButton.textContent =
            "Delete";


        deleteButton.onclick =
            async function(){

                const okay =
                    confirm(
                        "Delete this message?"
                    );


                if(!okay){
                    return;
                }


                try{

                    /*
                     * Delete Firestore message.
                     *
                     * IMPORTANT:
                     * This does NOT delete the Cloudinary
                     * media file.
                     *
                     * Cloudinary deletion requires a
                     * secure authenticated/server-side
                     * request.
                     */

                    await deleteDoc(
                        doc(
                            db,
                            "conversations",
                            getConversationId(),
                            "messages",
                            id
                        )
                    );


                }catch(error){

                    console.error(
                        error
                    );


                    alert(
                        "Unable to delete message.\n\n" +
                        error.message
                    );

                }

            };


        bubble.appendChild(
            deleteButton
        );

    }


    row.appendChild(
        bubble
    );


    chatWindow.appendChild(
        row
    );

}


/* =========================================================
   SEND MESSAGE
========================================================= */

window.sendMessage =
    async function(){

        if(!currentUser){

            alert(
                "Please login first."
            );

            return;

        }


        if(!selectedUser){

            alert(
                "Search for a user first."
            );

            return;

        }


        const input =
            document.getElementById(
                "chatInput"
            );


        const text =
            input
            ? input.value.trim()
            : "";


        /* =========================================
           MEDIA MESSAGE
        ========================================= */

        if(selectedMediaFile){

            await uploadMediaMessage(
                selectedMediaFile,
                text
            );

            return;

        }


        /* =========================================
           TEXT MESSAGE
        ========================================= */

        if(!text){
            return;
        }


        const conversationId =
            getConversationId();


        if(!conversationId){
            return;
        }


        try{

            if(input){

                input.disabled =
                    true;

            }


            await addDoc(
                collection(
                    db,
                    "conversations",
                    conversationId,
                    "messages"
                ),
                {

                    type:
                        "text",

                    text:
                        text,

                    senderId:
                        currentUser.uid,

                    senderName:
                        currentUser.displayName ||
                        currentUser.email,

                    receiverId:
                        selectedUser.uid,

                    createdAt:
                        serverTimestamp()

                }
            );


            if(input){

                input.value =
                    "";

            }


        }catch(error){

            console.error(
                "Send message error:",
                error
            );


            alert(
                "Message could not be sent.\n\n" +
                error.message
            );


        }finally{

            if(input){

                input.disabled =
                    false;


                input.focus();

            }

        }

    };


/* =========================================================
   CLOUDINARY MEDIA UPLOAD
========================================================= */

async function uploadMediaMessage(
    file,
    caption
){

    if(
        !currentUser ||
        !selectedUser ||
        !file
    ){

        return;

    }


    /* =========================================
       MAX FILE SIZE
    ========================================= */

    const maxSize =
        50 * 1024 * 1024;


    if(file.size > maxSize){

        alert(
            "File is too large.\n\n" +
            "Maximum size is 50 MB."
        );

        return;

    }


    /* =========================================
       CHECK FILE TYPE
    ========================================= */

    const isImage =
        file.type.startsWith(
            "image/"
        );


    const isVideo =
        file.type.startsWith(
            "video/"
        );


    if(
        !isImage &&
        !isVideo
    ){

        alert(
            "Only images and videos are allowed."
        );

        return;

    }


    const conversationId =
        getConversationId();


    if(!conversationId){
        return;
    }


    const input =
        document.getElementById(
            "chatInput"
        );


    const preview =
        document.getElementById(
            "selectedMediaPreview"
        );


    try{

        if(input){

            input.disabled =
                true;

        }


        /* =========================================
           SHOW UPLOAD PROGRESS
        ========================================= */

        if(preview){

            preview.innerHTML = `

                <strong>
                    Uploading ${
                        isImage
                        ? "image"
                        : "video"
                    }...
                </strong>

                <div
                    style="
                        margin-top:10px;
                        height:10px;
                        background:#ddd;
                        border-radius:10px;
                        overflow:hidden;
                    "
                >

                    <div
                        id="uploadProgressBar"
                        style="
                            width:0%;
                            height:100%;
                            background:#087d3f;
                            transition:width .2s;
                        "
                    ></div>

                </div>

                <div
                    id="uploadPercent"
                    style="
                        margin-top:6px;
                        font-size:13px;
                    "
                >
                    0%
                </div>

            `;

        }


        /* =========================================
           CREATE FORM DATA
        ========================================= */

        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );


        /*
         * This folder helps organize Nexora chat
         * media in Cloudinary.
         *
         * It is an unsigned-upload-supported
         * parameter.
         */

        formData.append(
            "folder",
            "nexora-chat"
        );


        /* =========================================
           UPLOAD WITH XMLHttpRequest
           =========================================
           XMLHttpRequest is used instead of fetch
           because it gives us upload progress.
        ========================================= */

        const cloudinaryResponse =
            await new Promise(
                function(resolve, reject){

                    const xhr =
                        new XMLHttpRequest();


                    xhr.open(
                        "POST",
                        CLOUDINARY_UPLOAD_URL,
                        true
                    );


                    /* =================================
                       UPLOAD PROGRESS
                    ================================= */

                    xhr.upload.onprogress =
                        function(event){

                            if(!event.lengthComputable){
                                return;
                            }


                            const percent =
                                Math.round(
                                    (
                                        event.loaded /
                                        event.total
                                    ) * 100
                                );


                            const bar =
                                document.getElementById(
                                    "uploadProgressBar"
                                );


                            const percentText =
                                document.getElementById(
                                    "uploadPercent"
                                );


                            if(bar){

                                bar.style.width =
                                    percent +
                                    "%";

                            }


                            if(percentText){

                                percentText.textContent =
                                    percent +
                                    "%";

                            }

                        };


                    /* =================================
                       SUCCESS
                    ================================= */

                    xhr.onload =
                        function(){

                            if(
                                xhr.status >= 200 &&
                                xhr.status < 300
                            ){

                                try{

                                    const result =
                                        JSON.parse(
                                            xhr.responseText
                                        );


                                    resolve(
                                        result
                                    );

                                }catch(error){

                                    reject(
                                        new Error(
                                            "Cloudinary returned invalid data."
                                        )
                                    );

                                }

                            }else{

                                let errorMessage =
                                    "Cloudinary upload failed.";


                                try{

                                    const errorData =
                                        JSON.parse(
                                            xhr.responseText
                                        );


                                    if(
                                        errorData.error &&
                                        errorData.error.message
                                    ){

                                        errorMessage =
                                            errorData.error.message;

                                    }

                                }catch(error){

                                    /* Ignore JSON parsing error */

                                }


                                reject(
                                    new Error(
                                        errorMessage +
                                        " HTTP " +
                                        xhr.status
                                    )
                                );

                            }

                        };


                    /* =================================
                       NETWORK ERROR
                    ================================= */

                    xhr.onerror =
                        function(){

                            reject(
                                new Error(
                                    "Network error while uploading to Cloudinary."
                                )
                            );

                        };


                    /* =================================
                       ABORT
                    ================================= */

                    xhr.onabort =
                        function(){

                            reject(
                                new Error(
                                    "Cloudinary upload was cancelled."
                                )
                            );

                        };


                    /* =================================
                       SEND
                    ================================= */

                    xhr.send(
                        formData
                    );

                }
            );


        /* =========================================
           CHECK CLOUDINARY RESPONSE
        ========================================= */

        if(
            !cloudinaryResponse ||
            !cloudinaryResponse.secure_url
        ){

            throw new Error(
                "Cloudinary did not return a media URL."
            );

        }


        const downloadURL =
            cloudinaryResponse.secure_url;


        const publicId =
            cloudinaryResponse.public_id ||
            "";


        const resourceType =
            cloudinaryResponse.resource_type ||
            (
                isImage
                ? "image"
                : "video"
            );


        /* =========================================
           SAVE MESSAGE IN FIRESTORE
        ========================================= */

        await addDoc(
            collection(
                db,
                "conversations",
                conversationId,
                "messages"
            ),
            {

                type:
                    isImage
                    ? "image"
                    : "video",

                text:
                    caption || "",

                fileUrl:
                    downloadURL,

                cloudinaryPublicId:
                    publicId,

                cloudinaryResourceType:
                    resourceType,

                fileName:
                    file.name,

                fileSize:
                    file.size,

                mimeType:
                    file.type,

                senderId:
                    currentUser.uid,

                senderName:
                    currentUser.displayName ||
                    currentUser.email,

                receiverId:
                    selectedUser.uid,

                createdAt:
                    serverTimestamp()

            }
        );


        /* =========================================
           CLEAR SELECTED MEDIA
        ========================================= */

        selectedMediaFile =
            null;


        const fileInput =
            document.getElementById(
                "nexoraMediaInput"
            );


        if(fileInput){

            fileInput.value =
                "";

        }


        const mediaPreview =
            document.getElementById(
                "selectedMediaPreview"
            );


        if(mediaPreview){

            mediaPreview.remove();

        }


        if(input){

            input.value =
                "";


            input.disabled =
                false;


            input.focus();

        }


    }catch(error){

        console.error(
            "Cloudinary media upload error:",
            error
        );


        alert(
            "Media could not be sent.\n\n" +
            error.message
        );


        selectedMediaFile =
            null;


        const fileInput =
            document.getElementById(
                "nexoraMediaInput"
            );


        if(fileInput){

            fileInput.value =
                "";

        }


        const mediaPreview =
            document.getElementById(
                "selectedMediaPreview"
            );


        if(mediaPreview){

            mediaPreview.remove();

        }


        if(input){

            input.disabled =
                false;


            input.focus();

        }

    }

}


/* =========================================================
   ENTER TO SEND
========================================================= */

window.handleChatKey =
    function(event){

        if(
            event.key === "Enter" &&
            !event.shiftKey
        ){

            event.preventDefault();


            sendMessage();

        }

    };


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(timestamp){

    if(!timestamp){

        return "Sending...";

    }


    try{

        const date =
            timestamp.toDate();


        return date.toLocaleString(
            [],
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );


    }catch(error){

        return "";

    }

}


/* =========================================================
   NEX BALANCE
========================================================= */

async function loadNex(){

    if(!currentUser){
        return;
    }


    try{

        const userDoc =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );


        if(userDoc.exists()){

            const data =
                userDoc.data();


            const nex =
                Number(
                    data.nex ||
                    0
                );


            const balance =
                document.getElementById(
                    "nexBalance"
                );


            if(balance){

                balance.textContent =
                    nex +
                    " Nex";

            }


            const activity =
                document.getElementById(
                    "nexActivity"
                );


            if(activity){

                activity.textContent =
                    "Your Nex balance is " +
                    nex +
                    " Nex.";

            }

        }

    }catch(error){

        console.error(
            "Nex error:",
            error
        );

    }

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

window.showNotifications =
    function(){

        if(!currentUser){

            alert(
                "Login to see your Nexora notifications."
            );

            return;

        }


        alert(
            "🔔 Nexora Notifications\n\n" +
            "You are currently signed in as " +
            (
                currentUser.displayName ||
                currentUser.email
            ) +
            "."
        );

    };


/* =========================================================
   COIN FLIP
========================================================= */

window.coinFlip =
    function(){

        const result =
            Math.random() < 0.5
            ? "HEADS 🪙"
            : "TAILS 🪙";


        alert(
            "Nexora Coin Flip\n\n" +
            result
        );

    };


/* =========================================================
   NUMBER GAME
========================================================= */

window.startNumberGame =
    function(){

        const secret =
            Math.floor(
                Math.random() * 10
            ) + 1;


        const answer =
            prompt(
                "Guess a number from 1 to 10:"
            );


        if(answer === null){

            return;

        }


        if(
            Number(answer) ===
            secret
        ){

            alert(
                "🎉 Correct!"
            );

        }else{

            alert(
                "❌ Not this time.\n\n" +
                "The number was " +
                secret +
                "."
            );

        }

    };


/* =========================================================
   SIMPLE NEX RELOAD
========================================================= */

window.refreshNex =
    function(){

        loadNex();

    };


/* =========================================================
   INITIAL PAGE MESSAGE
========================================================= */

console.log(
    "Nexora Firebase + Cloudinary script loaded."
);


console.log(
    "Cloudinary cloud:",
    CLOUDINARY_CLOUD_NAME
);


console.log(
    "Cloudinary preset:",
    CLOUDINARY_UPLOAD_PRESET
);
