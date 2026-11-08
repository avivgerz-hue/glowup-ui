const mod = await import("./tests/a11y.test.mjs").catch(e=>{console.log("IMPORT ERR", e.message); return null});
