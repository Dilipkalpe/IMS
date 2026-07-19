using System.Windows;

using System.Windows.Controls;

using System.Windows.Threading;

using IMS.ViewModels;



namespace IMS.Views;



/// <summary>Wires Loaded / DataContextChanged so every page loads API data after the view is ready.</summary>

public static class PageViewHost

{

    public static void Attach(UserControl view)

    {

        object? pendingContext = null;



        void QueueNotify(object? dataContext)

        {

            if (dataContext is not IPageViewLoadAware)

                return;



            pendingContext = dataContext;

            view.Dispatcher.BeginInvoke(() =>

            {

                if (!ReferenceEquals(pendingContext, dataContext))

                    return;



                pendingContext = null;

                if (!view.IsLoaded || !ReferenceEquals(view.DataContext, dataContext))

                    return;



                Notify(dataContext);

            }, DispatcherPriority.Loaded);

        }



        view.Loaded += (_, _) => QueueNotify(view.DataContext);

        view.DataContextChanged += (_, e) =>

        {

            if (view.IsLoaded)

                QueueNotify(e.NewValue);

        };

    }



    public static void Notify(object? dataContext)

    {

        if (dataContext is IPageViewLoadAware loadAware)

            loadAware.OnPageViewLoaded();

    }

}


