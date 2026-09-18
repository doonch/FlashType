function lesson(name, file, category, convertToYtping, linkToDictionary) {
	this.name=name;
	this.file=file;
	this.category = category;
	this.convertToYtping = convertToYtping;
	this.linkToDictionary = linkToDictionary;
}

var lessonFiles = new Array();
lessonFiles[0] = new lesson("Test", "lessons/test.txt", "TestCategory", false, true);
lessonFiles[lessonFiles.length] = new lesson("Food and drink", "lessons/CA.food.txt", "Cantonese.ca", false, true);
lessonFiles[lessonFiles.length] = new lesson("Basics", "lessons/CP.1.txt", "Cantonese.ca", false, true);
lessonFiles[lessonFiles.length] = new lesson("Time", "lessons/CP.2.txt", "Cantonese.ca", false, true);
lessonFiles[lessonFiles.length] = new lesson("Money", "lessons/CP.3.txt", "Cantonese.ca", false, true);
lessonFiles[lessonFiles.length] = new lesson("Life", "lessons/C.Dan.1.txt", "Cantonese.Dan", false, true);
lessonFiles[lessonFiles.length] = new lesson("Numbers", "lessons/CP.nums.txt", "Cantonese.Dan", false, true);
lessonFiles[lessonFiles.length] = new lesson("Review List 1: 29-Mar-2013", "lessons/C1.ReviewList1.txt", "Cantonese 1", false, true);
lessonFiles[lessonFiles.length] = new lesson("Review List 2: 3-May-2013", "lessons/C1.ReviewList2.txt", "Cantonese 1", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.1: 8-Oct-2013", "lessons/C4.L1.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.2: 15-Oct-2013", "lessons/C4.L2.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.3: 21-Oct-2013", "lessons/C4.L3.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.4: 19-Nov-2013", "lessons/C4.L4.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.8: 04-Dec-2013", "lessons/C4.L8.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.3.1", "lessons/C4.L3.Video1.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C4.3.2", "lessons/C4.L3.Video2.Dan.Jyutping.txt", "Cantonese 4", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.1: 28-Jan-2014", "lessons/C5.L1.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.2: 4-Feb-2014", "lessons/C5.L2.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.2.1: class vocabulary", "lessons/C5.L2.class.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.3: 18-Feb-2014", "lessons/C5.L3.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.4: 4-Mar-2014", "lessons/C5.L4.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.5: 11-Mar-2014 Video", "lessons/C5.L5.Video3.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.5.1: 11-Mar-2014 class", "lessons/C5.L5.class.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.6: 18-Mar-2014", "lessons/C5.L6.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C5.6.1: 18-Mar-2014 colors", "lessons/C5.L6.Colors.txt", "Cantonese 5", false, true);
lessonFiles[lessonFiles.length] = new lesson("C6.0: 7-Jul-2014 big list", "lessons/Cantonese.all.txt", "Cantonese 6", false, true);
lessonFiles[lessonFiles.length] = new lesson("C6.1: 8-Jul-2014", "lessons/C6.L1.txt", "Cantonese 6", false, true);
lessonFiles[lessonFiles.length] = new lesson("C6.1.1: 8-Jul-2014 Video 4", "lessons/C6.L1.Video4.txt", "Cantonese 6", false, true);
lessonFiles[lessonFiles.length] = new lesson("C6.2: 15-Jul-2014", "lessons/C6.L2.txt", "Cantonese 6", false, true);
lessonFiles[lessonFiles.length] = new lesson("Lesson 0: Numbers", "lessons/Hebrew.numbers.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 1: food", "lessons/Hebrew.1.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 2: drink", "lessons/Hebrew.2.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 3: names", "lessons/Hebrew.3.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 4: home, office", "lessons/Hebrew.4.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 5: construct", "lessons/Hebrew.5.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 6: consonants", "lessons/Hebrew.6.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 7: lovesick", "lessons/Hebrew.7.txt", "Hebrew", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 1: setting meetings", "lessons/Polish.1.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 2: times", "lessons/Polish.2.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 3: conjunctions", "lessons/Polish.3.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 4: declensions", "lessons/Polish.4.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 5: pronouns, conjunctions", "lessons/Polish.5.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 6: adjectives, conjugation", "lessons/Polish.6.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 7: idioms", "lessons/Polish.7.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 8: verbs, flights", "lessons/Polish.8.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 9: Names", "lessons/Polish.9.txt", "Polish", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 1: ser, hablar", "lessons/Spanish.1.txt", "Spanish", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 1: 12-May-2014", "lessons/Mandarin.1n.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 1 (pinyin): 12-May-2014", "lessons/Mandarin.1.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 1.2: 19-May-2014", "lessons/Mandarin.1.2n.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 2.1: 19-May-2014", "lessons/Mandarin.2n.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 2.1: 25-May-2014", "lessons/Mandarin.2.1.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 2.2: 25-May-2014", "lessons/Mandarin.2.2.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 3.1: 03-Jul-2014", "lessons/Mandarin.3.1.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 3.2: 10-Jul-2014", "lessons/Mandarin.3.2.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("LESSON 4.1: 17-Jul-2014", "lessons/Mandarin.4.1.txt", "Mandarin", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 1: adverbs", "lessons/Greek.1.txt", "Greek", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 2: verbs", "lessons/Greek.Voc.2.txt", "Greek", false, false);
lessonFiles[lessonFiles.length] = new lesson("Lesson 3: foundation", "lessons/Greek.MT.3.txt", "Greek", false, false);
lessonFiles[lessonFiles.length] = new lesson("Test", "lessons/test.txt", "TestCategory", false, false);
lessonFiles[lessonFiles.length] = new lesson("Civics 2008", "lessons/civics.txt", "Civics", false, false);

function populateLessons() {
	var output="<option value=\"0\">Select lesson...</option>\n";
	var groups = [];
	var query = window.location.pathname;
	if (query.search("cantonese")>=0) {
		groups = ["Cantonese.Dan", "Cantonesse.ca", "Cantonese 6", "Cantonese 5", "Cantonese 4", "Cantonese 1"];
	}
	else if (query.search("hebrew")>=0) {
		groups = [ "Hebrew"];
	}
	else if (query.search("mandarin")>=0) {
		groups = [ "Mandarin"];
	}
	else if (query.search("greek")>=0) {
		groups = [ "Greek"];
	}
	else if (query.search("polish")>=0) {
		groups = [ "Polish"];
	}
	else {
		groups = ["Cantonese.Dan", "Cantonese.ca", "Cantonese 1", "Cantonese 4", "Cantonese 5", "Cantonese 6", "Hebrew", "Polish", "Spanish", "Mandarin", "Greek", "Civics"];
	}
	var i;
	for (i=0; i<groups.length; i++) {
		output=output+"<optgroup label=\""+groups[i]+"\">\n";
		var j;
		for (j=0; j<lessonFiles.length; j++) {
			curLesson=lessonFiles[j];
			if (curLesson.category == groups[i]) {
				output=output+"<option value=\""+j+"\">"+curLesson.name+"</option>\n";
			}
		}
		output=output+"</optgroup>";
	}
	$("#lesson")[0].innerHTML=output;
}

var presentYtping = false;
var linkToDictionary = true;
