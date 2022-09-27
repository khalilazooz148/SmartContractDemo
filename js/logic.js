
    //"wss://smart-purple-wave.matic-testnet.discover.quiknode.pro/418f09a556c7f939fe811a0cf339e3cfa93090c8/"
    // const web3 = new Web3();
    // const FromAddress = '0xe1caa4bd7390553e73d5da4b75964564cd757505';
    // const privateKey = '0xf9ed0b7b1cbd3b760ec4b5addea184df6773aee07d9a694d117b056251f4cb2b';
    const contractAddress = '0x855fc1Ed2149c245B15A6EcD28409f013D99f57E';
    // web3.eth.accounts.privateKeyToAccount(privateKey);

    async function loadWeb3() {
        console.log(window.ethereum)
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            window.ethereum.enable();
        } else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    }
    // function onRecieveConfirmation(json)
    // {
    //     console.log(json);
    // }

    // async function do_the_send(encoded){
    //     var block =  await web3.eth.getBlock("latest");
    //     var gasLimit = Math.round(block.gasLimit / block.transactions.length);
    //     var tx = {
    //         gas :   gasLimit,
    //         to  :   contractAddress,
    //         data:   encoded
    //     }
    //     await web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
    //         web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', onRecieveConfirmation)
    //     })
    // }

    async function checkBalanceById() {
        var account = document.getElementById('CardNum').value;
        const container = document.getElementById("CardIdContainer");
        try{
            var balance = await window.myContractInstance.methods.checkBalanceByCardPAN(account).call();
            container.innerHTML = '<div class="alert alert-primary" role="alert"><tr><td><b>'+document.getElementById("CardNum").value+'</b></td><td>:</td> <td>'+`${balance / 100} USD`+'</td> </tr></div>'
        }
        catch(err)
        {
            container.innerHTML = '<div class="alert alert-danger" role="alert"><b>'+err+' </b></div>'
        }
    }

    async function addFundsByAdmin() {
        var amount = document.getElementById('addFundsByAdmin-Amount').value;
        var cardPan = document.getElementById('addFundsByAdmin-CardPan').value;
        const container = document.getElementById("addFundsByAdmin-Container");


        try {
            var info = await window.myContractInstance.methods.card(cardPan).call();
            console.log(info);
            var json = JSON.parse(JSON.stringify(info));
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            await window.myContractInstance.methods.addFundsByAdmin(json['cardAddress'],amount).send({from:accounts[0]}).on('receipt', function(data){
                var data= '{"time":"'+Math.floor(Date.now() / 1000).toString()+'","dir":"in","cardId":"'+cardPan+'","value":"'+amount+'","status":"APPROVED","hash" :"'+data['transactionHash']+'"}';
                $.post("https://smartcontractdb-default-rtdb.firebaseio.com/"+cardPan+".json",data,function(data,status){});
            });
            container.innerHTML = '<div class="alert alert-primary" role="alert"><b>'+document.getElementById("addFundsByAdmin-CardPan").value+' </b>: Is added</div>'
        }
        catch(err)
        {
            container.innerHTML = '<div class="alert alert-danger" role="alert"><b>'+err+' </b></div>'
        }
    }

    
    function timeConverter(timeStamp){
        var UNIX_timestamp = parseInt(timeStamp);
        var a = new Date(UNIX_timestamp * 1000);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
        return time;
      }

    async function GetTxsList() {        
        var result;
        const table = document.getElementById("txs-table-body");
        var CardNum = document.getElementById('CardPan-txs').value;
        if(CardNum)
        {
            var values = null;
            await $.get("https://smartcontractdb-default-rtdb.firebaseio.com/"+CardNum+".json",{},
            function(data,status){
                if(data != null)
                values = Object.values(data);
            });

            table.innerHTML = "";
            if(values != null)
            for (let index = 0; index < values.length; index++) {
                const element = values[index];
                var value = '';
                if(element['dir'] == 'in')
                {
                    value = '<p class="text-success">' + (parseInt(element['value'])/100) + ' USD</p>';
                }
                else
                {
                    value = '<p class="text-danger">' +(parseInt(element['value'])/100) *(-1) + ' USD</p>';
                }
                console.log(value);
                const row = "<tr>"+
                                "<td>"+timeConverter(element['time'])+"</td>" +
                                "<td>"+element['cardId']+"</td>" +
                                "<td>"+value+"</td>" +
                                "<td>"+element['status']+"</td>"+
                                "<td><a target='_blank' class='link-success' style='text-decoration: none;' href='https://mumbai.polygonscan.com/tx/"+element['hash']+"'>"+element['hash']+"</a></td>"+
                            "</tr>";
                table.innerHTML = table.innerHTML + row;
            }
        }
    }
    
    async function load() {
        const status = document.getElementsByClassName("status");
        for (let index = 0; index < status.length; index++) {
            status[index].innerHTML = '<span class="badge bg-warning text-dark">Loading ... </span>';
        }
        await loadWeb3();
        const abi = await fetch('./abi.json');
        const json = await abi.json()
        window.myContractInstance = await new window.web3.eth.Contract(json, contractAddress);
        for (let index = 0; index < status.length; index++) {
            status[index].innerHTML = '<span class="badge bg-success">Ready </span>';
        }
    }

    load();
