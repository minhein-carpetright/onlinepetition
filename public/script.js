// console.log("sanity check:", $);

const canvas = $("canvas");
// add [0] to get the DOM object:
const ctx = canvas[0].getContext("2d");
const body = $("body");
const clear = $("#clear");
const signature = $("#signature");
let mousedown = false;

canvas
    .on("mousedown", () => {
        console.log("mousedown");
        mousedown = true;
        ctx.beginPath();
    })
    // draw line wherever the mouse goes
    .on("mousemove", (e) => {
        if (mousedown) {
            console.log("mousemove");
            e.stopPropagation();
            // getBoundingClientRect() method returns the size of an element and its position relative to the viewport, equal to width/height:
            const offset = canvas[0].getBoundingClientRect();
            let x = e.clientX - offset.left;
            let y = e.clientY - offset.top;
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 5;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    })
    // stop drawing when mouse goes up
    .on("mouseup", () => {
        console.log("mouseup");
        // generate URL which represents signature:
        const signatureUrl = canvas[0].toDataURL(); // could be in parantheses: (0.5; makes it smaller, default is 0.92)
        // put value of URL in hidden input field:
        console.log("signatureUrl:", signatureUrl);
        signature.val(signatureUrl);
    });

body.on("mouseup", (e) => {
    mousedown = false;
    e.stopPropagation();
});

clear.on("click", () => {
    console.log("click clear");
    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    signatureUrl = null; // does "false" also work?
});
