function generateBundleName(properties) {
    var separator = '.';
    if (properties.length === 0) { separator = ''; }
    return 'bundle' + separator + properties.join('.') + '.js';
}

module.exports = generateBundleName;