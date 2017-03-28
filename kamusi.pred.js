

window.onload = function() {
  
  document.getElementById("button").onclick= run;

  document.getElementById("sentence")
	.addEventListener("keyup", function(event) {
		event.preventDefault();
		
		if (event.keyCode == 13) {
			
			run();
		}
	});
};

/*function disambiguateWord(){
	var disambiguateDiv = $(this).find('.disambiguateDiv');
	disambiguateDiv = disambiguateDiv[0];
	disambiguateDiv.style.display = 'block';
	displayInfo(this);
}*/

function displayInfo(){


	
	var disambiguateSelect = $(this).find('.disambiguateSelect');
	disambiguateSelect = disambiguateSelect[0];
	var selectedIndex = disambiguateSelect.selectedIndex;

	var prevIndex = $("body").data('displayed');
	
	if(prevIndex != -1){
		var wordsDiv = $('.wordDiv');
		var wordDiv = wordsDiv[prevIndex];
		wordDiv.className = wordDiv.className.replace(/\bw3-lime\b/,'w3-pale-green');
		wordDiv.className = wordDiv.className.replace(/\bw3-border-black\b/,'w3-border-green');

		var defDivs = $('.displayedDefDiv');

		for (var i = 0; i < defDivs.length; i++) {
			var defDiv = defDivs[i];
			defDiv.style.display = "none";
			
			if($(defDiv).hasClass("singleWord")){
				defDiv.className = "defDiv";
			}
			else{
				defDiv.className = "mweDefDiv";
			}

			wordDiv.appendChild(defDiv);


			
		}
		$('#right-container').html('');
		
	}
	this.className = this.className.replace(/\bw3-pale-green\b/,'w3-lime');
	this.className = this.className.replace(/\bw3-border-green\b/,'w3-border-black');
	var index = $(this).data("index");
	
	$("body").data("displayed", index);
	
	if(selectedIndex == 0){

		var defDiv = $(this).find('.defDiv');
		defDiv = defDiv[0];
		defDiv.className = "w3-container w3-light-grey w3-border w3-round-xlarge displayedDefDiv right_container_div singleWord";  //right_container_div class is used to find the div
		defDiv.style="overflow-y:scroll; max-height:300px; display = 'block'";
		$('#right-container').append($(defDiv));
	}

	// .singleWord vs .multiWord : used to identify whether the word is single or mwe..used in displayInfo()..

	else if(selectedIndex == 1){

		var mweDefDivs = $(this).find('.mweDefDiv');
		for (var i = 0; i < mweDefDivs.length; i++) {
			mweDefDiv = mweDefDivs[i];
			mweDefDiv.className = "w3-container w3-light-blue w3-border w3-round-xlarge displayedDefDiv right_container_div multiWord";
			mweDefDiv.style="overflow-y:scroll; max-height:300px; display = 'block'";
			$('#right-container').append($(mweDefDiv));
		}
	}
	
	
	
}


// this function shows/hides the definition div when the termDiv is clicked
function showDefDiv( ){

	
	if(this.nextSibling.style.display == -1){
		//this.nextSibling.style.display = 'block';
		this.nextSibling.style="overflow-y:scroll; max-height:300px; display = 'block'";
	}
	else{
		this.nextSibling.style.display = 'none';
	}

}

// this function shows the selected definition in the termDiv
function showDefinition( ){
	
	var index = $("body").data('displayed');
	

	var wordsDiv = $('.wordDiv');
	var wordDiv = wordsDiv[index];

	var definition = this.getAttribute("id");
	
				
	var termDiv = $(wordDiv).find('p'); //this.parentNode.parentNode.parentNode.previousSibling;
	termDiv = termDiv[0];
	//alert(termDiv.innerHTML);

	
	

	$(termDiv).text("Selected Definition: "+definition);
}

function run( ) {
	
	
	//////INPUTS:: /////
	
	var sentence = document.getElementById("sentence").value;
	var dumpTarget = document.getElementById("dumpdiv");
   
    
  $.post("https://kamusigold.org/preD/test"
		,{sentence:sentence},function (data) {
             
               	displayResults(data,sentence, dumpTarget);
               });
} 


function displayResults(data, sentence, dumpTarget){

	//dumpTarget.innerHTML = "";

	////////////////////////////////////////////////////////////////
	/// ----------    	Processing data from the server ------------
	/////////////////////////////////////////////////////////////////


	// loops around the words returned from the server,
	// and create for each object:
	// 1.term - 2.POS - 3.Definitions - 4.Ex Sent(if found)
	// store the objects in serverWords
	serverWords=[];
	for (var i = 0; i < data.length; i++) {
		var obj = {};
		var word = data[i].term.lemma;

		var pos = data[i].term.pos;
		var definitions = [];
		var example_sents = [];
		
		var synsets = data[i].synsets;
		for (var j = 0; j < synsets.length; j++){
			var definition = synsets[j].definition;
			var example_sent = synsets[j].example_sents;
			definitions.push(definition);
			example_sents.push(example_sent);	
		}
		obj.word=word;
		obj.pos=pos;
		obj.def=definitions;
		obj.example_sents = example_sents;
		//alert(JSON.stringify(obj));
		serverWords.push(obj);	
  }
 
    // loops around the words submited by the user
    // for each single word, create an object containg:
    // ALL the POS, Def, Ex Sent returned by the server for that word

	var words = sentence.trim().split(/\s+/);

	//var remWords = words;
	

	// Creating an object for each single word
	singleWords=[];	
	for (var i = 0; i < words.length; i++) {
		word = words[i];
		var wordObject = {};
		wordObject.term = word;
		wordObject.MWE = [];
		wordObject.mweIndex = [];
		singleWords.push(wordObject);

	}

	// ALl the WORK!!

	userWords=[];
	//var regex = /[!"#$%&'()*+, \-./:;<=>?@ [\\\]^_`{|}~]/g;
	for (var i = 0; i < words.length; i++) {
		
		/*---Regex Thing---
		var w1 = remWords[0];
		remWords = remWords.slice(1);
		
		var remSentence = remWords.join(' ');
		var regexQuery = '('+remSentence.replace(regex,' ').trim().split(/[\s]+/).join(')? ?(')+')?$';
		regexQuery = '^'+w1+' ?' + regexQuery;
		
		regexQuery = new RegExp(regexQuery,'g');
		*/

		wordObject = singleWords[i];
		var isMWE = 0;
		word = wordObject.term;

		pos = [];
		def = [];
		example_sents = [];

		var mweObjects = []; // array of mwe objects for the corresponding single word
		
		var mweObject = {}; // object of possbile mwes for the single word
		mwePos = [];
		mweDef = [];
		mweExample_sents = [];

		// for the corresponding user single word, link it to server words

		for (var j=0; j < serverWords.length; j++){
			
			// --- Regex Thing ----
			//alert("server word "+serverWords[j].word);
			//alert("query "+regexQuery);
			//alert("word "+serverWords[j].word+" regexQuery "+regexQuery+" match? "+regexQuery.test(serverWords[j].word));

			if (serverWords[j].word == word){  // single user word is equal to server single word
					
				for (var k=0; k <  serverWords[j].def.length; k++){
					pos.push(serverWords[j].pos);
					def.push(serverWords[j].def[k]);
					example_sents.push(serverWords[j].example_sents[k]);
				}	
			}	

			else if (serverWords[j].word.indexOf(word) == 0){ // single user word is part of MWE server term (problem? if "turn" is part of "turn up" ,
															 // 													but there is no "up" after "turn" ) 
			//else if(regexQuery.test(serverWords[j].word)){

			//alert("MWE word catched");


			// --- object.MWE : ARRAY Storing ALL the possible MWE of the single word ----
			// --- object.mweIndex : stores the index start of each corresponding MWE ----

			wordObject.MWE.push(serverWords[j].word);
			wordObject.isMWE = 0;  
			wordObject.mweIndex.push(i);  // this tells that the start of the MWE is at the i'th user word (helpful for later single words in a MWE)

			isMWE = 1;      // so that we push the MWE later
			
			mweObject.term = serverWords[j].word;
			
			for (var k=0; k <  serverWords[j].def.length; k++){
				mwePos.push(serverWords[j].pos);
				mweDef.push(serverWords[j].def[k]);
				mweExample_sents.push(serverWords[j].example_sents[k]);
			}

			// flag other single words of the mwe HOW?: Take other single words of the MWE and then for each word, find corresponding User Words
			var mweWords = serverWords[j].word.split(" ");
			for (var m = 1; m <  mweWords.length; m++){  // m starts from 1 to skip the current word (will be added seperately in the code..)
				mweWord = mweWords[m];

				for (var n = i+1; n <  singleWords.length; n++){ //look for the rest of the user single words after the current word( that's why I start from i+1)
					if(mweWord == singleWords[n].term){
						singleWords[n].MWE.push(serverWords[j].word);
						singleWords[n].mweIndex.push(i);
					}
				}
			}

			mweObject.pos = mwePos;
			mweObject.def = mweDef;
			mweObject.example_sents = mweExample_sents;
			mweObject.isMWE = 1;
			mweObjects.push(mweObject);
	
			mweObject = {};
			mwePos = [];
			mweDef = [];
			mweExample_sents = [];
			}	
		}

		wordObject.pos = pos;
		wordObject.def = def;
		wordObject.example_sents = example_sents;

		wordObject.mweObjects = mweObjects;

		userWords.push(wordObject);
		//alert("Term: "+wordObject.term+" , suggested MWEs: "+wordObject.MWE); 
		//alert(wordObject.MWE);
/*
		// pushing all MWEs
		for (var p = 0; p <  mweObjects.length; p++){ 
			var mweObject = mweObjects[p];
			userWords.push(mweObject);

		}
*/
	}
	//Thus user Words contain : single words; each single word has a key "mweObjects" which contain possible MWEs for the word.

	////////////////////////////////////////////////////////////////
	/// ----------    End of Processing data from the server --------
	/////////////////////////////////////////////////////////////////

	$( "body" ).data( "displayed", -1);
	var left_container = document.getElementById("left-container");
	var singleWordsCount = -1;
	for (var i = 0; i < userWords.length; i++) {
		if(!userWords[i].isMWE){
			singleWordsCount++;
			var wordDiv = document.createElement("div");
			wordDiv.className = "wordDiv w3-container w3-pale-green w3-leftbar w3-border-green w3-hover-border-red";
			wordDiv.innerHTML = userWords[i].term; 
			$(wordDiv).data("index", singleWordsCount);
			
			
			$(wordDiv).data("stack", []);   // to store the deleted li definintions
			$(wordDiv).data("nb_def", userWords[i].def.length);  
			wordDiv.onclick = displayInfo;
			

			var definition = document.createElement("div");
			definition.className = "w3-panel w3-sand w3-border";
			

			var definitionTxt = document.createElement("p");
			definitionTxt.innerHTML = "Selected Definition:";

			definition.appendChild(definitionTxt);
			wordDiv.appendChild(definition);


			

			for (var k = 0; k < userWords[i].mweObjects.length +1; k++) {
				var defDiv = document.createElement("div");
				if(k == 0){
					
					defDiv.setAttribute('class','defDiv w3-container');
				}
				else{
					defDiv.setAttribute('class','mweDefDiv w3-container');
				}
				
			
			$(defDiv).data("stack", []);
			defDiv.style.display = 'none';

			var undoBtn = document.createElement("img");
		undoBtn.setAttribute('title','Restore Definition');
		undoBtn.setAttribute('class','undoBtn w3-container');
		undoBtn.setAttribute('src','rsz_undo_once.png');

		undoBtn.onclick =( function(){
		
		/*	var wordsDiv = $('.wordDiv');
			var index = $("body").data("displayed");
			var stack = $(wordDiv).data("stack"); 
			var wordDiv = wordsDiv[index];*/

			var right_container_div = $(".right_container_div").has($(this));
			right_container_div = right_container_div[0];

			var stack = $(right_container_div).data("stack");

			var ul = $(right_container_div).find("ul"); 
			ul = ul[0];
			
	
			var restored_li = stack.pop();
			
			if(restored_li != undefined){
				$(restored_li).css("background-color",""); // removes the gray background
				
				
				$(ul).prepend(restored_li);  // reaching the "ul" element
				$(right_container_div).data("stack", stack);    // storing the stack back in the wordDiv

		/*		var nb_def = $(wordDiv).data("nb_def");
				nb_def+=1;
				$(wordDiv).data("nb_def", nb_def); */
			}
		});


		defDiv.appendChild(undoBtn);

		var undoAllBtn = document.createElement("img");
		undoAllBtn.setAttribute('title','Restore All Definitions');
		undoAllBtn.setAttribute('class','undoBtn w3-container');
		undoAllBtn.setAttribute('src','rsz_undo_all.png');

		undoAllBtn.onclick =( function(){
		
			/*	var wordsDiv = $('.wordDiv');
			var index = $("body").data("displayed");
			var stack = $(wordDiv).data("stack"); 
			var wordDiv = wordsDiv[index];*/

			var right_container_div = $(".right_container_div").has($(this));
			right_container_div = right_container_div[0];

			var stack = $(right_container_div).data("stack");

			var ul = $(right_container_div).find("ul"); 
			ul = ul[0];

			restored_li = stack.pop();
			while(restored_li != undefined){
				$(restored_li).css("background-color","");
				
				$(ul).prepend(restored_li);  // reaching the "ul" element
				$(right_container_div).data("stack", stack);    // storing the stack back in the wordDiv

		/*		var nb_def = $(wordDiv).data("nb_def");
				nb_def+=1;
				$(wordDiv).data("nb_def", nb_def); */
				
				restored_li = stack.pop();
			}
		});
		defDiv.appendChild(undoAllBtn);			

		//<button class="w3-btn">Button Button</button>
		var insertDefDiv = document.createElement('div');
		insertDefDiv.className = "insertDefDiv w3-container";
		var insertDefBtn = document.createElement('input');
		insertDefBtn.setAttribute('type', 'button');
		insertDefBtn.className = "w3-btn w3-teal insertDefBtn w3-wide w3-container";
		insertDefBtn.value = "Insert a New Definition";
		
		//insertDefBtn.clear ="both";

		

		$(insertDefBtn).on('click', function(){
			
			var insertDiv = document.createElement('div');
			insertDiv.className = "newDefinition w3-container";

			var defInsrt = document.createElement('input');
			defInsrt.setAttribute('type','text');
			defInsrt.className = 'w3-input w3-animate-input ';
			defInsrt.style = "width:50%";
			
			
			var defLabel = document.createElement("LABEL");
			defLabel.className = 'w3-label ';
			$(defLabel).text("Definition");
			insertDiv.appendChild(defLabel);
			insertDiv.appendChild(defInsrt);

			var posInsrt = document.createElement('input');
			posInsrt.setAttribute('type','text');
			posInsrt.className = 'w3-input w3-animate-input';// w3-animate-input';
			posInsrt.style = "width:50%";
			
			var posLabel = document.createElement("LABEL");
			posLabel.className = 'w3-label';
			$(posLabel).text("Part of Speech");
			insertDiv.appendChild(posLabel);
			insertDiv.appendChild(posInsrt);

			var submitDef = document.createElement('input');
			submitDef.setAttribute('type', 'button');
			submitDef.className = "w3-btn w3-green w3-container";
			submitDef.value = "Submit";
			$(submitDef).on('click', function(){

				var definition = defInsrt.value;
				var partOS = posInsrt.value;
				
				
				var li = document.createElement('li');
				li.className = "w3-hover-yellow w3-container";

				//might not work with IE browser
				var removeBtn = document.createElement("img");
				removeBtn.style.cssFloat = "left";
				
				removeBtn.onclick =( function(){
					
				
					
					var right_container_div = $(".right_container_div").has($(this));
					right_container_div = right_container_div[0];

					var stack = $(right_container_div).data("stack");

					var ul = $(right_container_div).find("ul"); 
					ul = ul[0];
					
					
					//var removed_li = $(this.parentNode);
					var removed_li = $("li").has($(this));
					removed_li = removed_li[0];
				

					stack.push(removed_li);

					


					$(right_container_div).data("stack", stack);
					
					$(removed_li).detach();

					

			/*		var nb_def = $(wordDiv).data("nb_def");
					nb_def-=1;
					$(wordDiv).data("nb_def", nb_def); */
					
					
				});
				

				
				removeBtn.setAttribute('title','Remove Definition');
				removeBtn.setAttribute('class','removeBtn w3-container');
				removeBtn.setAttribute('src','rsz_trash.png');
				
				li.appendChild(removeBtn);

				var wordsDiv = $('.wordDiv');
				var index = $("body").data("displayed");
				var wordDiv = wordsDiv[index];

							

				var right_container_div = $(".right_container_div").has($(this));
				right_container_div = right_container_div[0];

				var stack = $(right_container_div).data("stack");

				var ul = $(right_container_div).find("ul"); 
				ul = ul[0];

				var term = $(ul).data("term");
				

				var radioInput = document.createElement('INPUT');
				radioInput.setAttribute('type', 'radio');
				radioInput.setAttribute('name', term);
				radioInput.setAttribute('id', definition);
				radioInput.onclick = showDefinition;

				removeBtn.onmouseover = function(){
					this.parentNode.setAttribute('style','background-color: #C0C0C0 !important');

				}

				removeBtn.onmouseout = function(){
					this.parentNode.setAttribute('style','background-color: ');
				}


				
				li.appendChild(radioInput);
				
				var label = document.createElement("LABEL");

				label.setAttribute("title","Select Definition");
				label.setAttribute("for", definition);
			
				var defElement = document.createElement("b");
				defElement.innerHTML = "Definition: ";
				var defText = document.createTextNode(definition);
				
				var posElement = document.createElement("b");
				posElement.innerHTML = ", Part of Speech: ";
				var posText= document.createTextNode(partOS);
				
				

			    
			    label.innerHTML += "<span><span></span></span>";
			    
			    label.appendChild(defElement);
			    label.appendChild(defText);
			    label.appendChild(posElement);
			    label.appendChild(posText);
			    
			    
			    li.appendChild(label);
			  
				var br = document.createElement("br");
			    li.appendChild(br);

				var right_container_div = $(".right_container_div").has($(this));
				right_container_div = right_container_div[0];

				var stack = $(right_container_div).data("stack");

				var ul = $(right_container_div).find("ul"); 
				ul = ul[0];
							
				

				//alert(termDiv.innerHTML);
					    
			    $(ul).prepend(li);

			    var insertDiv = this.parentNode;
				$(insertDiv).detach();

			});

			insertDiv.appendChild(submitDef);

			var delDef = document.createElement('input');
			delDef.setAttribute('type', 'button');
			delDef.className = "w3-btn w3-red w3-container";
			delDef.value = "Discard";
			$(delDef).on('click', function(){

		    var insertDiv = this.parentNode;
			$(insertDiv).detach();
			});

			insertDiv.appendChild(delDef);
			$(insertDiv).insertAfter($(this));

		});
		insertDefDiv.appendChild(insertDefBtn);
		defDiv.appendChild(insertDefDiv);

		var ul = document.createElement('ul');
		$(ul).data("term",userWords[i].term);

		ul.className ="w3-ul clearBoth w3-container";// w3-border";
		
		// creating an li radio button for each definition
		
		if(k == 0){
			var dataObject = userWords[i];
			
		}
		else{
			var dataObject = userWords[i].mweObjects[k-1];
			
		}
		for (var j = 0; j < dataObject.def.length; j++){

			var li = document.createElement('li');
			li.className = "w3-hover-yellow w3-container";

			//might not work with IE browser
			var removeBtn = document.createElement("img");
			removeBtn.style.cssFloat = "left";
			
			removeBtn.onclick =( function(){
				
				var right_container_div = $(".right_container_div").has($(this));
				right_container_div = right_container_div[0];

				var stack = $(right_container_div).data("stack");

			
				
				//var removed_li = $(this.parentNode);
				var removed_li = $("li").has($(this));
				removed_li = removed_li[0];
			

				stack.push(removed_li);

				


				$(right_container_div).data("stack", stack);
				
				$(removed_li).detach();

				

				/*var nb_def = $(wordDiv).data("nb_def");
				nb_def-=1;
				$(wordDiv).data("nb_def", nb_def);*/ 
				
			});
			

			
			removeBtn.setAttribute('title','Remove Definition');
			removeBtn.setAttribute('class','removeBtn w3-container');
			removeBtn.setAttribute('src','rsz_trash.png');
			
			li.appendChild(removeBtn);		

			var radioInput = document.createElement('INPUT');
			radioInput.setAttribute('type', 'radio');
			radioInput.setAttribute('name', dataObject.term);
			radioInput.setAttribute('id', dataObject.def[j]);
			radioInput.onclick = showDefinition;

			removeBtn.onmouseover = function(){
				this.parentNode.setAttribute('style','background-color: #C0C0C0 !important');

			}

			removeBtn.onmouseout = function(){
				this.parentNode.setAttribute('style','background-color: ');
			}


			
			li.appendChild(radioInput);
			
			var label = document.createElement("LABEL");

			label.setAttribute("title","Select Definition");
			label.setAttribute("for", dataObject.def[j]);
		
			var defElement = document.createElement("b");
			defElement.innerHTML = "Definition: ";
			var defText = document.createTextNode(dataObject.def[j]);
			
			var posElement = document.createElement("b");
			posElement.innerHTML = ", Part of Speech: ";
			var posText= document.createTextNode(dataObject.pos[j] );
			
			var exElement = document.createElement("b");
			exElement.innerHTML = ", Context Example: ";
		
			var exText = document.createTextNode(dataObject.example_sents[j]);
			

		    
		    label.innerHTML += "<span><span></span></span>";
		    
		    label.appendChild(defElement);
		    label.appendChild(defText);
		    label.appendChild(posElement);
		    label.appendChild(posText);
		    
		    if(exText.length){        //if context example is not empty, display it 
		    label.appendChild(exElement);
		    label.appendChild(exText);
			}
		    
		    li.appendChild(label);
		  
			var br = document.createElement("br");
		    li.appendChild(br);
		    
		    ul.appendChild(li);
		}

		defDiv.appendChild(ul);

		wordDiv.appendChild(defDiv);

		// creating a div for disambiguating the word



	}

		var disambiguateDiv = document.createElement("div");
		disambiguateDiv.className = "w3-container disambiguateDiv";

		var selectList = document.createElement("select");
		selectList.className = "w3-select disambiguateSelect";
		


		var options = ["Single Word","First Word of MWE","Suggest a MWE"];

		for (var op = 0; op < options.length; op++) {
		    var option = document.createElement("option");
		    option.value = options[op];
		    option.text = options[op];
		    selectList.appendChild(option);
		}

		disambiguateDiv.appendChild(selectList);
		wordDiv.appendChild(disambiguateDiv);

		left_container.appendChild(wordDiv);

		}
	}

	
	// To Do:
	// 1. insert a new definition:
	//       * make it "selected" once it's submitted
	//		 * user should insert once only.. then the "add definition option" should disappear!!
	// 2. put the "# of defs" as a support number to the right (not so big!!)
	// 3. once user click "return", submit sentence!!
	

// To Do:
	// 2. in case i have same word ( "give up and sky is up" so two "up"s for give), let the user selects (once he click on "give up") which "up" is it..
	


	//6. Enhancemeent: if a mwe is a concetenation of two words, i.e. there is no space between the mwe words
	// (e.g. turn up is "turnup", no space between "turn" and "up"), the code is not detecting the MWE for the 
	//                 second, third, ... words.

	/////////////////////////////////////////////////////////////////////
	/// ------------ Displaying Results ---------------------------------
	/////////////////////////////////////////////////////////////////////


 } 
