describe('login page', function() {
	browser.get('http://localhost:3000/#!/login');
	
	it('should have an email text input', function() {
		expect(element(by.model('user.email')).isPresent()).toBe(true);
	});
	
	it('should have a logo image', function() {
		logoimg = element(by.css("img[src*='/img/provacca-logo.png']"));
		expect(logoimg.isPresent()).toBe(true);
	});
});