// -------------------------
// DAILY STREAK
// -------------------------

function loadStreak(){

const today=new Date().toDateString();

const last=localStorage.getItem("lastVisit");

let streak=parseInt(localStorage.getItem("streak")||"0");

if(last!==today){

const yesterday=new Date();

yesterday.setDate(yesterday.getDate()-1);

if(last===yesterday.toDateString()){

streak++;

}else{

streak=1;

}

localStorage.setItem("streak",streak);

localStorage.setItem("lastVisit",today);

}

const mission=document.getElementById("missionText");

if(mission){

mission.innerHTML=
"🔥 "+streak+" day streak";
}

}



// -------------------------
// MOOD TRACKER
// -------------------------

function saveMood(mood){

localStorage.setItem("todayMood",mood);

alert("Mood saved: "+mood);

}



// -------------------------
// ACHIEVEMENTS
// -------------------------

function checkAchievements(){

let wins=document.querySelectorAll("#winList li").length;

if(wins>=5){

alert("🏆 Achievement Unlocked: Momentum!");

}

}
