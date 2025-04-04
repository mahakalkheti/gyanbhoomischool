document.addEventListener("DOMContentLoaded", function () {
    let currentQuestion = 0;
    const questions = document.querySelectorAll(".question-container");
    const submitBtn = document.getElementById("submitBtn");

    function showQuestion(index) {
        questions.forEach(q => q.classList.remove("active"));
        if (index < questions.length) {
            questions[index].classList.add("active");
        } else {
            submitBtn.style.display = "block";
        }
    }

    document.querySelectorAll(".nextBtn").forEach(btn => {
        btn.addEventListener("click", function () {
            currentQuestion++;
            showQuestion(currentQuestion);
        });
    });

    showQuestion(0);
});
