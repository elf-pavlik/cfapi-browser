$(function(){

  var entryPoint = 'http://codeforamerica.org/api/projects';
  var graph = levelgraphJSONLD(levelgraph('abcdef'));

  jsonld_macros.registerAPI({
    "http://codeforamerica.org/api/projects/*": {
      "$": {
        "@context": { "@vocab": "http://schema.org/" },
        "@type": "Code",
        "@id": {"f:valueof": "api_url"},
        "@only": ["name", "description", "url", "forksCount", "watchersCount",  "issuesCount"],
        "@transform": {
          "url": { "f:valueof": "code_url" },
          "forksCount": [
            { "f:valueof": "github_details" },
            { "f:select": "forks_count"}
          ],
          "watchersCount": [
            { "f:valueof": "github_details" },
            { "f:select": "watchers_count"}
          ],
          "issuesCount": [
            { "f:valueof": "github_details" },
            { "f:select": "open_issues"}
          ]
        }
      }
    }
  });

  function getPagesCount(){
    return new Promise(function(resolve, reject){
      superagent.get(entryPoint)
       .end(function(res){
         if(!res.ok) reject(err);
         var number = Number(res.body.pages.last.replace(entryPoint + '?page=', ''));
         console.log('total pages', number);
         resolve(number);
       });
    });
  }

  function getPage(number){
    return new Promise(function(resolve, reject){
      superagent.get(entryPoint + '?page=' + number)
        .end(function(res){
          if(!res.ok) reject(err);
          console.log('received page nr', number);
          resolve(res.body);
        });
    });
  }

  function storeResource(resource){
    return new Promise(function(resolve, reject){
      graph.jsonld.put(resource, { "@context": resource["@context"] }, function(err, doc){
        if(err) reject(err);
        resolve();
      });
    });
  }

  function saveData(results){
    var data = _.flatten(_.map(results, function(set){ return set.objects; }), true);
    var filtered = _.filter(data, function(project){
      return project.github_details;
    });

    var ld = _.map(filtered, function(project){
       return jsonld_macros.resolve(project.api_url, project);
    });

    console.log(ld);

    Promise.all(ld.map(storeResource))
      .then(function(){
        console.log('data saved to levelgraph');
      }).catch(function(err){ console.log(err); });

  }

  var cache = function(){
    getPagesCount().then(function(pagesCount){
      Promise.all(_.range(1, pagesCount).map(getPage))
        .then(saveData)
        .catch(function(err){
          console.log(err);
        });
    }).catch(function(err){ console.log(err); });
  };

  // debug
  window.app = {
    graph: graph,
    cache: cache
  };

});
