var lines = new Array();
var index=GetRandomIndex();
var lastIndex=index;
var presentYtping;
var linkToDictionary;
var forgiveTones=false;
var autoLoop=false;

function set(n)
{
    this.data = new Array();
    for (var i=0; i<n; i++)
    {
       this.data[i] = false;
    }
    this.add = add;
    this.contains = contains;
    this.size = size;
    this.max = n;

    function add(k) { this.data[k] = true; }
    function contains(k) { return !!this.data[k]; }
    function size() { return this.data.reduce(function(a,b) { return a+(b?1:0); }, 0); }
}
var seen = new set(2);


function checkPress(e)
{
    var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
    if (charCode == 13 && e.ctrlKey)
    {
        showNextUnseen();
    }
    else if (charCode == 13)
    {
        checkAnswer();
    }
}

function clean(s)
{
    if (forgiveTones)
    {
        return s.replace(/\([\w .]*\)/g, "")
                .replace(/[ 1-9]/g, "")
                .toLowerCase();
    }
    return s.replace(/\([\w .]*\)/g, "")
            .replace(/ /g, "")
            .replace(/7/g, "1")
            .replace(/8/g, "3")
            .replace(/9/g, "6")
            .toLowerCase();
}

function getQueryText(s)
{
    return Ytping2Jyutping(clean(s.split("/")[0]))
        .replace(/([1-6])/g, "$1+")
        .replace(/\+$/, "");
}

function Jyutping2Ytping(s)
{
    return s.replace(/jyu/g, "y")
        .replace(/yu/g, "y")
        .replace(/([^a])ai/g, "$1aei")
        .replace(/eoi/g, "oey")
        .replace(/eon/g, "oen")
        .replace(/(^|[^d])z/g, "$1dz")
        .replace(/c/g, "ts")
        .replace(/([ptk])1/g, "$17")
        .replace(/([ptk])3/g, "$18")
        .replace(/([ptk])6/g, "$19");
}

function Ytping2Jyutping(s)
{
    return s.replace(/ts/g, "c")
        .replace(/dz/g, "z")
        .replace(/oey/g, "eoi")
        .replace(/oen([^g])/g, "eon$1")
        .replace(/aei/g, "ai")
        .replace(/y([^u])/g, "yu$1")
        .replace(/(^|\d|\s)y/g, "$1jy");
}

function playAnswer(s)
{
    return playAudio("aud_question", s);
}

function playAudio(e, s)
{
    s = s.replace(/ /g, "_")
         .replace(/\?/g, "")
         .replace(/^_/g, "")
         .replace(/_$/g, "");
    var audioEl = document.getElementById(e);
    if (!audioEl) return 0;
    var sourceEl = audioEl.querySelector("source");
    if (sourceEl) {
        sourceEl.src = "audio/" + s + ".wav";
    }
    try {
        audioEl.load();
        var playPromise = audioEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(function() {
                // Audio file might not exist or autoplay policy blocked it
            });
        }
        return audioEl.duration || 0;
    } catch (err) {
        return 0;
    }
}

function checkAnswer()
{
    var answer=$("#answer")[0].value;
    var correctAnswers= transliterate(lines[index]).split(":")[1].split("/");
    var answerIdx = Math.floor(Math.random() * correctAnswers.length);
    playAnswer(correctAnswers[answerIdx]);
    var gotAnswer=false;
    for (var i=0;i<correctAnswers.length;i++)
    {
        if (clean(answer)==clean(correctAnswers[i])) gotAnswer=true;
    }
    if (gotAnswer)
    {
        if (forgiveTones && correctAnswers.length==1)
            SetFeedback("Correct! It's: <span class=\"correct\">"+correctAnswers.join("/")+"</span>");
        else if (correctAnswers.length==1)
            SetFeedback("<span class=\"correct-fb\">Correct!</span>");
        else
            SetFeedback("<span class=\"correct-fb\">Correct!</span> Other options: "+correctAnswers.join("/"));
        showNext();
    }
    else
    {
        SetFeedback("<span class=\"incorrect-fb\">Wrong!</span> Not \"" + answer + "\", it's: <span class=\"correct\">"+correctAnswers.join("/")+"</span>. Try again!");
    }
    $("#answer")[0].value = "";
}

function skip()
{
    showNext();
    $("#answer")[0].value = "";
    SetFeedback("");
}

function transliterate(s)
{
    if (presentYtping == true)
    {
        s = Jyutping2Ytping(s);
    }
    return s;
}

function updateList(lines)
{
    tableData="";
    for (var i=0;i<lines.length;i++)
    {
        var value=transliterate(lines[i].split(":")[1]);
        if (linkToDictionary == true) {
            value = "<a href=\"http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=3&text="+getQueryText(lines[i].split(":")[1])+"\">"
                    +value
                    +"</a>";
        }
        tableData = tableData.concat("<tr><td>"+lines[i].split(":")[0]+"</td><td>"
                    + value
                    +"</td></tr>"
        );
    }
    $("#vocabTable")[0].innerHTML = tableData;
    $("#vocabTable tr").css("color", "");
}

function setQuestion(index)
{
    $("#question_txt")[0].innerHTML = "<span class=\"lesser-text\">["+index+"/"+seen.size()+"/"+lines.length+"]</span> " + lines[index].split(":")[0];
    playAudio("aud_question", lines[index].split(":")[0].split("/")[0]);
    if (autoLoop) {
        setTimeout(tellAnswerAndSkip, 4200);
    }
}

function tellAnswerAndSkip()
{
    var correctAnswers= transliterate(lines[index]).split(":")[1].split("/");
    var answerIdx = Math.floor(Math.random() * correctAnswers.length);
    var durationSec = playAnswer(correctAnswers[answerIdx]);
    $("#answer")[0].value = correctAnswers[answerIdx];
    //setTimeout(showNext, 3000 + Math.floor(1000*$("#aud_question")[0].duration));
    setTimeout(showNext, 3500);
}

function showNext()
{
    if (lines.length <= 1) {
        SetFeedback("<span class=\"incorrect-fb\">Notice: Lesson has 1 or fewer items.</span>");
    }
    index=GetRandomIndex();
    setQuestion(index);
}

function showNextUnseen()
{
    SetFeedback("Skipping...");
    for (var localIndex=0; localIndex<lines.length; localIndex++)
    {
        if (!seen.contains(localIndex))
        {
            index=localIndex;
            lastIndex=index;
            markSeen(index);
            setQuestion(index);
            return;
        }
    }
    showNext(); 
}

function GetRandomIndex()
{
    if (lines.length <= 1) {
        lastIndex = 0;
        if (typeof seen != "undefined") markSeen(0);
        return 0;
    }
    var newIndex=lastIndex;
    while (newIndex==lastIndex)
        newIndex=Math.floor(Math.random() * lines.length);
    lastIndex=newIndex;
    if (typeof seen != "undefined") markSeen(newIndex);
    return newIndex;
}

function markSeen(n)
{
    seen.add(n);
    $("#vocabTable tr").eq(n).css("color", "green");
}

function SetFeedback(s)
{
    $("#feedback")[0].innerHTML = s;
}

function toggleTable()
{
    var ret=$("#vocabTable").toggle();
    $("#toggleTable")[0].innerHTML = ((ret[0].style["display"]=="none") ? "Show": "Hide") + " List";
}

// http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();
