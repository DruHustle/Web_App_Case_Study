
(function ($) {
    "use strict";
    $('#calculated-content').hide();

    // this will handle the function for searching from the database
    $('#search-database').click(e=>{
        $('#proceed').text('Search').click(e => {
            var saveName = $('#save-name').val();
            if (saveName) {
                $('.modal').modal('hide');                
                $.ajax({
                    type: "GET",
                    url: "/save",
                    data: {data:saveName},
                    success: (data) => {
                        process_and_display(data) 
                    }
                });
            }
        })
        $('.modal').modal('show');
    })

    
    /*==================================================================
    [ Focus Contact2 ]*/
    $('.input100').each(function () {
        $(this).on('blur', function () {
            if ($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })
    })


    /*==================================================================
    [ Validate after type ]*/
    $('.validate-input .input100').each(function () {
        $(this).on('blur', function () {
            if (validate(this) == false) {
                showValidate(this);
            }
            else {
                $(this).parent().addClass('true-validate');
            }
        })
    })

    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.login100-form-btn').on('click', function (event) {
        var check = true;
        event.preventDefault();
        for (var i = 0; i < input.length; i++) {
            if (validate(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }
// if the form data is filled and valid
        if (check) {
            var formValues = {};
            $.each($("form").serializeArray(), (k, v) => {
                formValues[v.name] = v.value;
            });
            process_and_display(formValues);
            $('#save-database').click(e => {
                $('.modal').modal('show');
                
            });
            $('#proceed').click(e => {
                var saveName = $('#save-name').val();
                if (saveName) {
                    $('.modal').modal('hide');
                    formValues['savename'] = saveName;
                    $.ajax({
                        type: "POST",
                        url: "/save",
                        data: formValues,
                        success: (data) => {
                            console.log(data)
                        }
                    });
                }
            })
        }

        return false;
    });

    function process_and_display(data) {
        $('#calculated-content').show();
        $('#mortgage-table').html('');

        const pmt = calculatePMT(data);
        $('pmt').text(pmt);

        const interest = data.interest / 1200;
        var credit = data.price - data.deposit;

        var dataPointsI = [];
        var dataPointsC = [];

        jQuery.get('/layouts/table.html', (content) => {
            var tableLayout = content;
            jQuery.get('/layouts/tabletr.html', (content) => {
                var rowLayout = content;
                for (var year = 1; year <= data.duration; year++) {
                    var toAppend = $($.parseHTML(tableLayout));
                    var yearId = 'year' + year;

                    var yearRow = $($.parseHTML(rowLayout));

                    yearRow.find('period').text('+ Year ' + year);
                    yearRow.find('startCapitalR').text(credit.toFixed(2));

                    var yearInterestR = 0;
                    var yearCapitalR = 0;

                    for (var month = 1; month <= 12; month++) {
                        var monthRow = $($.parseHTML(rowLayout));
                        monthRow.find('period').text('Month ' + month);
                        monthRow.find('startCapitalR').text(credit.toFixed(2));

                        var mInterestR = Math.round(interest * 100 * credit) / 100;
                        yearInterestR += mInterestR;
                        monthRow.find('interestR').text(mInterestR.toFixed(2));

                        var mCapitalR = pmt - mInterestR;
                        yearCapitalR += mCapitalR;
                        credit -= mCapitalR;
                        monthRow.find('capitalR').text(mCapitalR.toFixed(2));

                        var mInterestP = Math.round(10000 * mInterestR / pmt) / 100;
                        monthRow.find('interestP').text(mInterestP.toFixed(2));

                        var mCapitalP = 100 - mInterestP;
                        monthRow.find('capitalP').text(mCapitalP.toFixed(2));

                        toAppend.find('tbody').append(monthRow);
                    }

                    yearRow.find('interestR').text(yearInterestR.toFixed(2));
                    dataPointsI[year - 1] = { y: yearInterestR, label: "Year " + year };

                    yearRow.find('capitalR').text(yearCapitalR.toFixed(2));
                    dataPointsC[year - 1] = { y: yearCapitalR, label: "Year " + year };

                    var yInterestP = Math.round(10000 * yearInterestR / (pmt * 12)) / 100;
                    yearRow.find('interestP').text(yInterestP.toFixed(2));
                    yearRow.find('capitalP').text((100 - yInterestP).toFixed(2));

                    toAppend.find('thead').attr('href', '#' + yearId).append(yearRow);


                    toAppend.find('tbody').attr('id', yearId);

                    $('#mortgage-table').append(toAppend);

                    displayBarGraph(dataPointsI, dataPointsC);
                }

            })
        })

    }

    function displayBarGraph(interest, capital) {
        var interval = 50;
        if ($(window).width() > 1300) {
            interval = 5
        }
        else if ($(window).width() > 400) {
            interval = 10
        }

        var options = {
            animationEnabled: true,
            theme: "light2", //"light1", "dark1", "dark2"
            title: {
                text: "Repayment Splits"
            },
            axisY: {
                interval: interval,
                suffix: "%"
            },
            toolTip: {
                shared: true
            },
            data: [{
                type: "stackedBar100",
                toolTipContent: "{label}<br><b>{name}:</b> {y} (#percent%)",
                showInLegend: true,
                name: "Interest",
                dataPoints: interest
            },
            {
                type: "stackedBar100",
                toolTipContent: "<b>{name}:</b> {y} (#percent%)",
                showInLegend: true,
                name: "Capital",
                dataPoints: capital
            }]
        };

        $("#mortgage-bar").CanvasJSChart(options);
    }

    function calculatePMT(data) {
        var netAmount = data.price - data.deposit;
        var interestPM = data.interest / 1200;
        var terms = data.duration * 12;

        var pmt = interestPM > 0 ? interestPM * netAmount / (1 - Math.pow((1 + interestPM), -terms)) : netAmount / terms;
        return Math.round(pmt * 100) / 100;
    }

    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
            $(this).parent().removeClass('true-validate');
        });
    });

    function validate(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if ($(input).val().trim() == '') {
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }



})(jQuery);