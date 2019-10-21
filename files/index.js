let playTimer;
let tasks = [];
let movieIdx = 0;
let movie = [];
let images = {};

const processNb = 10;


function getUrl(imageId, type) {
    return "/images/" + imageId + "/" + type + ".jpg"
}

function displayMainImage() {
    const currentSrc = $("#mainImage").attr("src");
    console.log(movieIdx)
    const imageId = movie[movieIdx];
    const img = images[imageId];
    if (!img) {
        console.log("Cannot display because image is not loaded:" + imageId)
        return;
    }

    if (img.hasOwnProperty("original")) {
        if (currentSrc != img["original"].src) {
            $("#mainImage").attr("src", img["original"].src);
        }
    } else if (img.hasOwnProperty("medium")) {
        if (currentSrc != img["medium"].src) {
            $("#mainImage").attr("src", img["medium"].src);
        }
    } else if (img.hasOwnProperty("tiny")) {
        if (currentSrc != img["tiny"].src) {
            $("#mainImage").attr("src", img["tiny"].src);
        }
    }
}

function loadImage(imageId, quality, onLoad) {
    return new Promise((resolve, reject) => {
        // console.log("load image: " + imageId)
        if (images.hasOwnProperty(imageId)) {
            if (images[imageId].hasOwnProperty(quality)) {
                resolve();
            } else if (images[imageId].hasOwnProperty("original") && (quality == "tiny" || quality == "medium")) {
                resolve();
            } else if (images[imageId].hasOwnProperty("medium") && quality == "tiny") {
                resolve();
            }
        }

        let img = new Image();
        img.onload = function(){
            if (!images.hasOwnProperty(imageId)) {
                images[imageId] = {};
            }
            images[imageId][quality] = img;
            resolve();
        };
        img.src = getUrl(imageId, quality);
    })
}

function loadAndDiplayMainImage(quality) {
    return loadImage(movie[movieIdx], quality)
            .then(() => displayMainImage());
}

function loadAndDisplayThumbnail(imageIndex) {
    const imageId = movie[imageIndex]
        return loadImage(imageId, "thumbnail")
        .then(() => {
            $("#gallery > img:nth-of-type(" + (imageIndex+1) + ")").attr("src", images[imageId]["thumbnail"].src);
        });
}

function displayThumbnails(prepend) {
    const scrollLeft = document.getElementById('gallery').scrollLeft;
    const windowWidth = $(document).width(); 
    const imagesWidth = $("#gallery > img").width();

    const startIndex = Math.floor(scrollLeft / (imagesWidth + 20));
    const lastIndex = startIndex + Math.floor(windowWidth / imagesWidth);

    for (let i = startIndex; i<=lastIndex; i++) {
        if (prepend) {
            tasks.unshift(() => loadAndDisplayThumbnail(i)); 
        } else {
            tasks.push(() => loadAndDisplayThumbnail(i)); 
        }
    }
}

function playMovie() {
    console.log(movieIdx)
    tasks = []
    for (let i = 0; i<=100; i++) {
        tasks.push(() => loadImage(movie[movieIdx+i], "tiny"));
    }
    playTimer = setInterval(() => { 
        movieIdx += 1;
        displayMainImage();
        if (tasks.length < 10) {
            tasks.push(() => loadImage(movie[movieIdx+100], "original"));
        } else if (tasks.length < 50) {
            tasks.push(() => loadImage(movie[movieIdx+100], "medium"));
        } else {
            tasks.push(() => loadImage(movie[movieIdx+100], "tiny"));
        }
    }, 1000 / 12)
}

function pauseMovie() {
    clearInterval(playTimer);
    tasks = []
    tasks.push(() => loadAndDiplayMainImage("tiny"));
    tasks.push(() => loadAndDiplayMainImage("medium"));
    tasks.push(() => loadAndDiplayMainImage("original"));
}

function init() {
    return new Promise((resolve, reject) => {
        $.getJSON('/project.json', function(project) {
            document.title = "Baku - " + project.name;

            movie = project.images;

            let html = ""
            for (let i = 0; i<project.images.length; i++) {
                html += "<img data-index=" + i + ' alt=""/>'
            }
            $("#gallery").append(html);

            resolve();
        });
    })
}

function setEventHandlers() {
    return new Promise((resolve, reject) => {
        $("#gallery").scroll(() => {
            displayThumbnails(true)
        });
        $("#gallery img").click((ev) => {
            movieIdx = parseInt($(ev.target).attr("data-index"), 10);

            tasks = [];
            tasks.push(() => loadAndDiplayMainImage("tiny"));
            displayThumbnails();
            tasks.push(() => loadAndDiplayMainImage("medium"));
            tasks.push(() => loadAndDiplayMainImage("original"));
        });
        $("#play").click((ev) => {
            playMovie();
        });
        $("#pause").click((ev) => {
            pauseMovie();
        });
        resolve();
    })
}

function processNewTask(executor) {
    task = tasks.shift();
    if (task) {
        console.log("processNewTask [" + tasks.length + "]");
        executor
            .then(task)
            .then(() => { pickNextTask(executor) });
        return true
    }
    return false
}

function pickNextTask(executor) {
    return new Promise((resolve, reject) => {
        if (processNewTask(executor)) {
            resolve()
        } else {
            // console.log("start timer");
            let timer = setInterval(() => { 
                if (processNewTask(executor)) {
                    if (timer) {
                        clearInterval(timer);
                    }
                    resolve(); 
                }
            }, 50)
        }
    })
}

init().then(() => {
    tasks.push(setEventHandlers);
    tasks.push(() => loadAndDiplayMainImage("tiny"));
    displayThumbnails();
    tasks.push(() => loadAndDiplayMainImage("medium"));
    tasks.push(() => loadAndDiplayMainImage("original"));
    for (let i = 1; i<20; i++) {
        tasks.push(() => loadImage(movie[movieIdx+i], "thumbnail"));
    }
    for (let i = 1; i<500; i++) {
        tasks.push(() => loadImage(movie[movieIdx+i], "tiny"));
    }
}).then(() => {
    for (let i = 0; i<processNb; i++) {
        pickNextTask(new Promise((r) => { r(); }));
    }
})
