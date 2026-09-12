// Review-only input choreography. Uses normal movement, shots and damage.
// Both comparisons take the same route; only weapon selection differs.
function tuesdayInput(combo) {
    let q = clock % 600, y = q >= 65 && q < 480 ? 248 : 378;
    keys.z = true;
    keys.Shift = q >= 340 && q < 480;
    keys.ArrowUp = p.y > y + 2;
    keys.ArrowDown = p.y < y - 2;
    keys.ArrowLeft = p.x > 194;
    keys.ArrowRight = p.x < 190;
    let slot = combo ? (q >= 180 && q < 250 ? 1 : q >= 280 && q < 340 ? 2 : 0) : 0;
    if (p.ci !== slot) pressed[String(slot + 1)] = true;
}
