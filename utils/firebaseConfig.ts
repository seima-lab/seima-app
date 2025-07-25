import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyD2IsX12iu1mDeZ-GrmAUHl372UP-_Xqzs",
  authDomain: "seima-datn.firebaseapp.app",
  projectId: "seima-datn",
  storageBucket: "seima-datn.firebasestorage.app",
  messagingSenderId: "817321421895",
  appId: "1:817321421895:android:a391f99002e0406a2b5562",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}
