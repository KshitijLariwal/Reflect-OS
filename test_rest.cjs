// This script will just define the REST payload
const payload = {
  structuredQuery: {
    from: [{ collectionId: "entries" }],
    // Wait, does structuredQuery support vector search?
  }
};
console.log(payload);
