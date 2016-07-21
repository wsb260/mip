fis.set('project.files', [
   'extensions/**'     
]);
fis.hook('amd', {
});

fis.match('*', {
    release: false
});

fis.match('extensions/*/*/*.js', {
	optimizer: fis.plugin('uglify-js'),
    release: true
});
fis.media('debug').match('*.{js,css,less}', {
    useHash: false,
    optimizer: null
});
fis.match('*.less', {
    parser: fis.plugin('less'),
    rExt: '.css'
});