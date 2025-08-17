export default {
  async fetch(request) {
    try {
      const url = 'https://raw.githubusercontent.com/MainScripts352/Database/refs/heads/main/Countries.json';
      const resp = await fetch(url);
      const data = await resp.json();

      // Turn into array of [name, {Flag}]
      const entries = Object.entries(data);

      // Pick random correct answer
      const correctIndex = Math.floor(Math.random() * entries.length);
      const [correctName, correctObj] = entries[correctIndex];
      const correctFlag = correctObj.Flag;

      // Pick 3 random unique options
      const options = [];
      while (options.length < 3) {
        const i = Math.floor(Math.random() * entries.length);
        if (i !== correctIndex) {
          const [optName, optObj] = entries[i];
          if (!options.some(o => o.name === optName)) {
            options.push({ name: optName, flag: optObj.Flag });
          }
        }
      }

      // Build quiz object
      const quiz = {
        Question: `What country is this ${correctFlag}?`,
        answer: { name: correctName, flag: correctFlag },
        options: {
          1: options[0],
          2: options[1],
          3: options[2]
        }
      };

      return new Response(JSON.stringify(quiz, null, 2), {
        headers: { 'content-type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};
