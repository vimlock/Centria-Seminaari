engine.scene = [];
engine.scene.current = {};





engine.scene.change = function(nextScene) {
	var sceneDifferences = this.getLoadable(this.current, this[nextScene]);
	this.loadScene(sceneDifferences);
}





engine.scene.loadscene = function(differences) {
	
}





engine.scene[0] = {};