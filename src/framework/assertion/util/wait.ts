
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(fn, ...args) {
    await timeout(3000);
    return fn(...args);
}

export async function waitSeconds(n: number) {
    await timeout(n * 1000);
}
