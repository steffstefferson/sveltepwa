import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";
import config from "./../config";

firebase.initializeApp(config.secret.firebaseConfig);

export const auth = firebase.auth();
export const EmailAuthProvider = new firebase.auth.EmailAuthProvider();
export const db = firebase.database();
export const storage = firebase.storage();
