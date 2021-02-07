exports.json2csv = (json) => {
  let csv = Object.keys(json[0]).join("\t") + "\n";
  json.forEach((item) => {
    csv = csv + Object.values(item).join("\t") + "\n";
  });
  return csv;
};
