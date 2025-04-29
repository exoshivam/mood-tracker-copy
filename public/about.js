const slider = document.getElementById("imageSlider");
const dotsContainer = document.getElementById("dotsContainer");
const totalImages = slider.children.length;
let currentIndex = 0;

function showSlide(index) {
  slider.style.transform = `translateX(-${index * 100}%)`;
  Array.from(dotsContainer.children).forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

for (let i = 0; i < totalImages; i++) {
  const dot = document.createElement("span");
  dot.classList.add("dot");
  if (i === 0) dot.classList.add("active");
  dot.addEventListener("click", () => {
    currentIndex = i;
    showSlide(currentIndex);
  });
  dotsContainer.appendChild(dot);
}

setInterval(() => {
  currentIndex = (currentIndex + 1) % totalImages;
  showSlide(currentIndex);
}, 6000);
