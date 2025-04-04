document.addEventListener("DOMContentLoaded", function () {
    function setupInfiniteScroll(gridId, speed) {
        const grid = document.getElementById(gridId);
        grid.innerHTML += grid.innerHTML; // Duplicate content for smooth scrolling
        let scrollAmount = 0;

        function scrollAnimation() {
            scrollAmount -= speed;
            grid.style.transform = `translateX(${scrollAmount}px)`;

            if (Math.abs(scrollAmount) >= grid.scrollWidth / 2) {
                scrollAmount = 0;
            }

            requestAnimationFrame(scrollAnimation);
        }

        scrollAnimation();
    }

    setupInfiniteScroll("student-grid-10th", 2);
    setupInfiniteScroll("student-grid-12th", 2);
});
