export const prompt = '[root@localhost] # ~ ';
const loadedAt = new Date();
const loginDate = loadedAt.toDateString().slice(0, 10);
const loginTime = loadedAt.toTimeString().slice(0, 8);
export const loginMessage = `Last login: ${loginDate} ${loginTime} on ttys001`;
