const questions = [
    { question: "2 + 2 = ?", answer: "4" },
    { question: "5 x 3 = ?", answer: "15" },
    { question: "What is the capital of India?", answer: "Delhi" },
    { question: "8 - 3 = ?", answer: "5" }
];

function askQuestion(downloadLink) {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    const userAnswer = prompt(randomQuestion.question);

    if (userAnswer === randomQuestion.answer) {
        playConfetti();
        playSound();
        alert(" Sahi jawab! Download shuru ho raha hai...");
        window.open(downloadLink, "_blank");
    } else {
        alert(" Galat jawab! Dubara try karo.");
    }
}

function playConfetti() {
    const confettiElement = document.createElement("div");
    confettiElement.className = "confetti";
    document.body.appendChild(confettiElement);
    setTimeout(() => confettiElement.remove(), 2000);
}

function playSound() {
    const sound = new Audio("https://www.fesliyanstudios.com/play-mp3/4387");
    sound.play();
}
