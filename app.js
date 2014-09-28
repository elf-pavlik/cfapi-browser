$(function(){

  var entryPoint = 'http://codeforamerica.org/api/projects';
  superagent.get(entryPoint)
    .end(function(res){
      console.log(res.body);
    });
});
