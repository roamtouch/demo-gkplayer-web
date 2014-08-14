function TouchAnimation(imagesSources, imgHolder){
	this.imgHolder = imgHolder;
	this.imagesSources = imagesSources;
}
var removeImages;

TouchAnimation.prototype.generateImages = function(clientX, clientY){
	clearTimeout(removeImages);
	var x = Math.floor((Math.random() * this.imagesSources.length));
	var particleImg	= document.createElement("img");
	particleImg.setAttribute('src', this.imagesSources[x]);
	particleImg.className = 'particle-img';
	particleImg.style.left = clientX + 'px';
	particleImg.style.top = clientY + 'px';
	this.imgHolder.appendChild(particleImg);
}


TouchAnimation.prototype.animateAndRemoveImages = function(recognizedGesture)
{
	// clearTimeout(removeImages);
	var particleImgs = document.getElementsByClassName('particle-img');
	for(i=0; i<particleImgs.length; i++)
	{
		if(recognizedGesture)
		{
			particleImgs[i].style.paddingTop = Math.floor((Math.random() * 100) + 1 ) + 'px';
			particleImgs[i].style.opacity = 0;
		}
		else
		{
			particleImgs[i].style.marginTop = Math.floor(Math.random() * 201) - 100 + 'px';
			particleImgs[i].style.marginLeft = Math.floor(Math.random() * 201) - 100 + 'px';
			particleImgs[i].style.opacity = 0;
		}
	}

	var imgHolder = this.imgHolder;
	removeImages = setTimeout(function()
	{
		while (imgHolder.firstChild) {
			imgHolder.removeChild(imgHolder.firstChild);
		}
	},2000);
}

