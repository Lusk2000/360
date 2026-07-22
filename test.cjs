const React = require('react');
const ReactDOMServer = require('react-dom/server');
try {
  const html = ReactDOMServer.renderToString(React.createElement('input', { value: {a: 1} }));
  console.log("SUCCESS:", html);
} catch (e) {
  console.log("ERROR:", e.message);
}
