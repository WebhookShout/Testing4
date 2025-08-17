/**
 * Picks a random integer between 0 (inclusive) and max (exclusive)
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Fetch countries JSON and generate quiz question.
 */
async function generateCountryQuiz() {
  const url = 'https://raw.githubusercontent.com/MainScripts352/Database/refs/heads/main/Countries.json';

  // Fetch the JSON data
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch countries JSON: ${resp.status}`);
  }
  const data = await resp.json();

  // Convert to array of entries: [name, flagObj]
  const entries = Object.entries(data);

  // Choose the correct answer randomly
  const correctIndex = getRandomInt(entries.length);
  const [correctName, correctObj] = entries[correctIndex];
  const correctFlag = correctObj.Flag;

  // Pick 3 distinct random options (excluding the correct answer)
  const options = [];
  while (options.length < 3) {
    const i = getRandomInt(entries.length);
    if (i !== correctIndex) {
      const [optName, optObj] = entries[i];
      // Avoid duplicates
      if (!options.some(o => o.name === optName)) {
        options.push({ name: optName, flag: optObj.Flag });
      }
    }
  }

  // Build result as specified
  return {
    Question: `What country is this ${correctFlag}?`,
    answer: { name: correctName, flag: correctFlag },
    options: {
      1: options[0],
      2: options[1],
      3: options[2]
    }
  };
}

// Example usage in async context:
generateCountryQuiz()
  .then(quiz => console.log(JSON.stringify(quiz, null, 2)))
  .catch(console.error);
